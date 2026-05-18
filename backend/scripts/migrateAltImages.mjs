/**
 * migrateAltImages.mjs
 * Migrates alt images (images[1+]) to Cloudinary for all products.
 * Uses same raw HTTPS approach as proven migrateImages.mjs.
 *
 * Run:    MONGODB_URI=... CLOUDINARY_API_SECRET=... bun run scripts/migrateAltImages.mjs
 * Limit:  MAX_ITEMS=100 ... (process N products)
 * Resume: Automatically skips products with cloudinaryAltsDone=true
 */

import mongoose from '../../node_modules/mongoose/index.js';
import https from 'https';
import { createHash, randomBytes } from 'crypto';

const MONGO_URI   = process.env.MONGODB_URI;
const CLOUD_NAME  = process.env.CLOUDINARY_CLOUD_NAME || 'dtmes0dha';
const API_KEY     = process.env.CLOUDINARY_API_KEY    || '165872496672474';
const API_SECRET  = process.env.CLOUDINARY_API_SECRET;
const MAX_ITEMS   = process.env.MAX_ITEMS ? parseInt(process.env.MAX_ITEMS) : null;
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '8');

if (!MONGO_URI || !API_SECRET) {
  console.error('Missing MONGODB_URI or CLOUDINARY_API_SECRET');
  process.exit(1);
}

const log = msg => console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`);

// ── Upload one image to Cloudinary by URL ─────────────────────────────────────
function uploadToCloudinary(sourceUrl, publicId) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder    = 'petshiwu/products';

    // Decode wsrv.nl wrapper → get real scene7 URL
    let fetchUrl = sourceUrl;
    try {
      const u = new URL(sourceUrl);
      if (u.hostname === 'wsrv.nl') {
        const inner = u.searchParams.get('url');
        if (inner) fetchUrl = decodeURIComponent(inner).split('?')[0] + '?fmt=jpg&wid=800&hei=800';
      }
    } catch {}

    const sigStr    = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = createHash('sha1').update(sigStr).digest('hex');

    const boundary = `----Boundary${randomBytes(8).toString('hex')}`;
    const fields   = {
      api_key:   API_KEY,
      timestamp: String(timestamp),
      signature,
      folder,
      public_id: publicId,
      file:      fetchUrl,
    };

    let body = '';
    for (const [k, v] of Object.entries(fields)) {
      body += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
    }
    body += `--${boundary}--\r\n`;
    const bodyBuf = Buffer.from(body);

    const req = https.request({
      hostname: 'api.cloudinary.com',
      path:     `/v1_1/${CLOUD_NAME}/image/upload`,
      method:   'POST',
      headers:  {
        'Content-Type':   `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuf.length,
      },
      timeout: 20000,
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.secure_url) return resolve(json.secure_url);
          // 400 = image not found on source / invalid — treat as "doesn't exist"
          if (res.statusCode === 400) return resolve(null);
          reject(new Error(json.error?.message || `HTTP ${res.statusCode}`));
        } catch {
          reject(new Error(`Bad JSON: ${data.slice(0, 80)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(bodyBuf);
    req.end();
  });
}

// ── Process one product ────────────────────────────────────────────────────────
async function processProduct(col, product) {
  const id     = product._id.toString();
  const images = product.images || [];

  // images[0] = main → already Cloudinary (use cloudinaryImage field)
  const mainImg = product.cloudinaryImage || images[0];
  const newImages = [mainImg];

  let uploaded = 0;
  for (let i = 1; i < images.length; i++) {
    const wsrvUrl = images[i];
    if (!wsrvUrl || !wsrvUrl.includes('wsrv.nl')) continue;

    const publicId = `${id}_alt${i}`;
    try {
      const url = await uploadToCloudinary(wsrvUrl, publicId);
      if (url) { newImages.push(url); uploaded++; }
      // else: image doesn't exist on scene7 — skip (don't add broken URL)
    } catch {
      // Network error or rate limit — skip this alt
    }
  }

  await col.updateOne(
    { _id: product._id },
    { $set: { images: newImages, cloudinaryAltsDone: true } }
  );

  return uploaded;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  log(`🖼  Alt Image Migration | Concurrency: ${CONCURRENCY} | Limit: ${MAX_ITEMS || 'all'}`);

  await mongoose.connect(MONGO_URI, { dbName: 'petshop' });
  const col = mongoose.connection.db.collection('products');

  const query = {
    cloudinaryAltsDone: { $ne: true },
    cloudinaryImage: { $exists: true },
  };

  const total = await col.countDocuments(query);
  const toProcess = MAX_ITEMS ? Math.min(total, MAX_ITEMS) : total;
  log(`${total} products to process. Running ${toProcess}...\n`);

  const cursor = col.find(query, {
    projection: { _id: 1, name: 1, images: 1, cloudinaryImage: 1 },
  }).limit(toProcess);

  // Load into queue
  const queue = [];
  let doc;
  while ((doc = await cursor.next())) queue.push(doc);

  let done = 0, totalUploaded = 0;
  const startTime = Date.now();

  async function worker() {
    while (queue.length > 0) {
      const p = queue.shift();
      if (!p) break;
      const n = await processProduct(col, p);
      done++;
      totalUploaded += n;
      if (done % 50 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate    = done / elapsed;
        const eta     = Math.round((toProcess - done) / rate);
        const pct     = ((done / toProcess) * 100).toFixed(1);
        log(`[${pct}%] ${done}/${toProcess} | ${totalUploaded} alts uploaded | ~${eta}s left`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  log(`\n✅ Done in ${elapsed}s — ${totalUploaded} alt images uploaded to Cloudinary`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

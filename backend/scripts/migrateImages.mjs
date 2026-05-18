/**
 * Cloudinary Image Migration - fetch-by-URL + concurrent uploads
 *
 * Safe: adds cloudinaryImage field, never overwrites existing images[].
 * Cloudinary fetches the source URL directly — no local download needed.
 * Runs 5 concurrent uploads for speed.
 *
 * TEST:     TEST_ONLY=true bun run scripts/migrateImages.mjs
 * FULL:     MAX_ITEMS=500 bun run scripts/migrateImages.mjs
 * ROLLBACK: ROLLBACK=true bun run scripts/migrateImages.mjs
 */

import mongoose from '../../node_modules/mongoose/index.js';
import https from 'https';
import { createHash, randomBytes } from 'crypto';

const MONGO_URI  = process.env.MONGODB_URI;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dtmes0dha';
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const TEST_ONLY  = process.env.TEST_ONLY === 'true';
const ROLLBACK   = process.env.ROLLBACK === 'true';
const MAX_ITEMS  = process.env.MAX_ITEMS ? parseInt(process.env.MAX_ITEMS) : null;
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5');

const log = msg => console.log(`[${new Date().toISOString()}] ${msg}`);

// ── Upload to Cloudinary by passing the source URL directly ─────────────────
// Cloudinary fetches the image from the URL — no local download required
function uploadUrlToCloudinary(sourceUrl, productId) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder    = 'petshiwu/products';
    const pubId     = productId;

    // Decode wsrv.nl wrapper to get the real image URL
    let fetchUrl = sourceUrl;
    try {
      const u = new URL(sourceUrl);
      if (u.hostname === 'wsrv.nl') {
        const inner = u.searchParams.get('url');
        if (inner) fetchUrl = decodeURIComponent(inner);
      }
    } catch {}

    const sigStr    = `folder=${folder}&public_id=${pubId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = createHash('sha1').update(sigStr).digest('hex');

    // Build form data with URL as plain text field (Cloudinary fetches it)
    const boundary = `----Boundary${randomBytes(8).toString('hex')}`;
    const fields   = {
      api_key: API_KEY,
      timestamp: String(timestamp),
      signature,
      folder,
      public_id: pubId,
      file: fetchUrl   // ← Cloudinary fetches this URL directly
    };

    let body = '';
    for (const [k, v] of Object.entries(fields)) {
      body += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
    }
    body += `--${boundary}--\r\n`;

    const bodyBuf = Buffer.from(body);

    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuf.length
      },
      timeout: 30000
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.secure_url) return resolve(json.secure_url);
          reject(new Error(`Cloudinary: ${json.error?.message || data.slice(0, 150)}`));
        } catch {
          reject(new Error(`Bad response: ${data.slice(0, 100)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Upload timeout')); });
    req.write(bodyBuf);
    req.end();
  });
}

// ── Process a single product ─────────────────────────────────────────────────
async function processProduct(col, product, index, limit) {
  const id        = product._id.toString();
  const url       = product.images?.[0];
  const shortName = (product.name || 'Unknown').slice(0, 45);

  if (!url) return { ok: false, msg: `[${id}] no image URL` };

  try {
    const cloudUrl = await uploadUrlToCloudinary(url, id);
    await col.updateOne({ _id: product._id }, { $set: { cloudinaryImage: cloudUrl } });
    log(`[${index}/${limit}] ✅ ${shortName}`);
    if (TEST_ONLY) log(`         → ${cloudUrl}`);
    return { ok: true };
  } catch (err) {
    const msg = `[${id}] ${shortName}: ${err.message}`;
    log(`[${index}/${limit}] ❌ ${msg}`);
    return { ok: false, msg };
  }
}

// ── Run a pool of N concurrent workers ───────────────────────────────────────
async function runConcurrent(tasks, concurrency) {
  const results = [];
  let i = 0;

  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!MONGO_URI)              throw new Error('MONGODB_URI not set');
  if (!API_KEY || !API_SECRET) throw new Error('CLOUDINARY credentials not set');

  await mongoose.connect(MONGO_URI, { dbName: 'petshop' });
  const col = mongoose.connection.db.collection('products');

  // ROLLBACK
  if (ROLLBACK) {
    const r = await col.updateMany({ cloudinaryImage: { $exists: true } }, { $unset: { cloudinaryImage: '' } });
    log(`✅ Rolled back ${r.modifiedCount} products`);
    await mongoose.disconnect();
    return;
  }

  const remaining = await col.countDocuments({
    images: { $exists: true, $ne: [] },
    cloudinaryImage: { $exists: false }
  });
  const migrated = await col.countDocuments({ cloudinaryImage: { $exists: true } });
  const limit    = TEST_ONLY ? 10 : (MAX_ITEMS ?? remaining);

  log(`━━━ Cloudinary Migration ${TEST_ONLY ? 'TEST' : 'RUN'} ━━━`);
  log(`Already done: ${migrated} | Remaining: ${remaining} | This run: ${limit}`);
  log(`Concurrency: ${CONCURRENCY} | Cloud: ${CLOUD_NAME}`);
  log('');

  const products = await col.find(
    { images: { $exists: true, $ne: [] }, cloudinaryImage: { $exists: false } },
    { projection: { _id: 1, name: 1, images: 1 } }
  ).limit(limit).toArray();

  // Build tasks with index tracking
  let taskIndex = 0;
  const tasks = products.map((p, i) => () => processProduct(col, p, i + 1, limit));

  const results = await runConcurrent(tasks, CONCURRENCY);

  await mongoose.disconnect();

  const success  = results.filter(r => r.ok).length;
  const failed   = results.filter(r => !r.ok).length;
  const failures = results.filter(r => !r.ok).map(r => r.msg);

  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━ SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━');
  log(`✅ Succeeded : ${success}  |  ❌ Failed: ${failed}  |  Total done: ${migrated + success} / 10039`);
  if (failures.length) failures.forEach(f => log(`  ✗ ${f}`));
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });

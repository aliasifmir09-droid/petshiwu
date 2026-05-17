/**
 * Cloudinary Image Migration - runs with bun
 * Safe: adds cloudinaryImage field, never overwrites existing images array
 *
 * TEST:     TEST_ONLY=true bun run scripts/migrateImages.mjs
 * FULL:     bun run scripts/migrateImages.mjs
 * ROLLBACK: ROLLBACK=true bun run scripts/migrateImages.mjs
 */

import mongoose from '../../node_modules/mongoose/index.js';
import https from 'https';
import http from 'http';
import { createHash, randomBytes } from 'crypto';
import { URL } from 'url';

const MONGO_URI    = process.env.MONGODB_URI;
const CLOUD_NAME   = process.env.CLOUDINARY_CLOUD_NAME || 'dtmes0dha';
const API_KEY      = process.env.CLOUDINARY_API_KEY;
const API_SECRET   = process.env.CLOUDINARY_API_SECRET;
const BATCH_SIZE   = parseInt(process.env.BATCH_SIZE || '100');
const TEST_ONLY    = process.env.TEST_ONLY === 'true';
const ROLLBACK     = process.env.ROLLBACK === 'true';
const DELAY_MS     = 400;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log   = msg => console.log(`[${new Date().toISOString()}] ${msg}`);

// ── Download image buffer ────────────────────────────────────────────────────
function downloadImage(imageUrl, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));

    let fetchUrl = imageUrl;
    try {
      const parsed = new URL(imageUrl);
      if (parsed.hostname === 'wsrv.nl') {
        const inner = parsed.searchParams.get('url');
        if (inner) fetchUrl = decodeURIComponent(inner);
      }
    } catch {}

    const parsed = new URL(fetchUrl);
    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.get(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Petshiwu/1.0 image-migration)',
        'Accept': 'image/*,*/*'
      },
      timeout: 20000
    }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        const loc = res.headers.location;
        if (!loc) return reject(new Error('Redirect with no location'));
        return downloadImage(loc.startsWith('http') ? loc : `${parsed.origin}${loc}`, redirects + 1)
          .then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));

      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Download timeout')); });
  });
}

// ── Upload buffer to Cloudinary (no SDK) ────────────────────────────────────
function uploadToCloudinary(buffer, productId) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder    = 'petshiwu/products';
    const pubId     = productId;

    const sigStr    = `folder=${folder}&public_id=${pubId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = createHash('sha1').update(sigStr).digest('hex');

    const boundary = `----Boundary${randomBytes(8).toString('hex')}`;

    const fields = { api_key: API_KEY, timestamp: String(timestamp), signature, folder, public_id: pubId };
    let formText = '';
    for (const [k, v] of Object.entries(fields)) {
      formText += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
    }
    const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${productId}.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`;
    const footer     = `\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([
      Buffer.from(formText),
      Buffer.from(fileHeader),
      buffer,
      Buffer.from(footer)
    ]);

    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      },
      timeout: 30000
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.secure_url) return resolve(json.secure_url);
          reject(new Error(`Cloudinary: ${json.error?.message || data.slice(0, 200)}`));
        } catch {
          reject(new Error(`Bad Cloudinary response: ${data.slice(0, 150)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Upload timeout')); });
    req.write(body);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!MONGO_URI) throw new Error('MONGODB_URI not set');
  if (!API_KEY || !API_SECRET) throw new Error('CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set');

  await mongoose.connect(MONGO_URI, { dbName: 'petshop' });
  const col = mongoose.connection.db.collection('products');

  // ROLLBACK
  if (ROLLBACK) {
    log('ROLLBACK: removing cloudinaryImage from all products...');
    const r = await col.updateMany({ cloudinaryImage: { $exists: true } }, { $unset: { cloudinaryImage: '' } });
    log(`✅ Rolled back ${r.modifiedCount} products`);
    await mongoose.disconnect();
    return;
  }

  const remaining = await col.countDocuments({
    images: { $exists: true, $ne: [] },
    cloudinaryImage: { $exists: false }
  });
  const limit = TEST_ONLY ? 10 : remaining;

  log(`━━━ Cloudinary Migration ${ TEST_ONLY ? 'TEST (10 products)' : 'FULL RUN' } ━━━`);
  log(`Products to process: ${limit} (${remaining} remaining total)`);
  log(`Cloud: ${CLOUD_NAME} | Delay: ${DELAY_MS}ms between uploads`);
  log('');

  let success = 0, failed = 0;
  const failures = [];

  const cursor = col.find(
    { images: { $exists: true, $ne: [] }, cloudinaryImage: { $exists: false } },
    { projection: { _id: 1, name: 1, images: 1 } }
  ).limit(limit);

  let i = 0;
  for await (const product of cursor) {
    i++;
    const id  = product._id.toString();
    const url = product.images?.[0];
    const shortName = (product.name || 'Unknown').slice(0, 45);

    if (!url) { log(`[${i}] ⏭️  Skip (no image): ${shortName}`); continue; }

    try {
      const buf = await downloadImage(url);
      if (buf.length < 500) throw new Error(`Too small (${buf.length}B) — likely error page`);

      const cloudUrl = await uploadToCloudinary(buf, id);

      // ✅ Only set cloudinaryImage — NEVER touch images[]
      await col.updateOne({ _id: product._id }, { $set: { cloudinaryImage: cloudUrl } });

      success++;
      log(`[${i}/${limit}] ✅ ${shortName}`);
      if (TEST_ONLY) log(`         → ${cloudUrl}`);
    } catch (err) {
      failed++;
      const msg = `[${id}] ${shortName}: ${err.message}`;
      failures.push(msg);
      log(`[${i}/${limit}] ❌ ${msg}`);
    }

    await sleep(DELAY_MS);
  }

  await mongoose.disconnect();

  log('');
  log('━━━━━━━━━━━━━━━━━━━━━━ SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━');
  log(`✅ Succeeded : ${success}`);
  log(`❌ Failed    : ${failed}`);
  if (failures.length) {
    log('');
    log('Failures:');
    failures.forEach(f => log(`  ${f}`));
  }
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (TEST_ONLY) {
    log('');
    log('👆 Check petshiwu.com — products should still show images normally.');
    log('If all good, run the full migration (remove TEST_ONLY=true).');
    log('To undo: ROLLBACK=true bun run scripts/migrateImages.mjs');
  }
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });

/**
 * Cloudinary Image Migration Script
 * 
 * SAFE approach: adds `cloudinaryImage` field alongside existing `images`.
 * Never overwrites existing data until explicitly confirmed.
 * 
 * Usage:
 *   TEST (10 products):  BATCH_SIZE=10 TEST_ONLY=true ts-node src/scripts/migrateImagesToCloudinary.ts
 *   FULL RUN:            ts-node src/scripts/migrateImagesToCloudinary.ts
 *   ROLLBACK:            ROLLBACK=true ts-node src/scripts/migrateImagesToCloudinary.ts
 */

import mongoose from 'mongoose';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// ─── Config ──────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI!;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dtmes0dha';
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100');
const TEST_ONLY = process.env.TEST_ONLY === 'true';
const ROLLBACK = process.env.ROLLBACK === 'true';
const DELAY_MS = 300; // ms between uploads to avoid rate limits

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

/** Download a URL to a Buffer */
function downloadImage(imageUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Decode the wsrv.nl url to get the actual image URL
    let fetchUrl = imageUrl;
    try {
      const parsed = new URL(imageUrl);
      if (parsed.hostname === 'wsrv.nl') {
        // wsrv.nl wraps the real URL in `?url=` param
        const inner = parsed.searchParams.get('url');
        if (inner) fetchUrl = decodeURIComponent(inner);
      }
    } catch {}

    const parsedUrl = new URL(fetchUrl);
    const lib = parsedUrl.protocol === 'https:' ? https : http;

    lib.get(fetchUrl, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PetshiwuBot/1.0)' },
      timeout: 15000
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const loc = res.headers.location;
        if (loc) return downloadImage(loc).then(resolve).catch(reject);
        return reject(new Error('Redirect with no location'));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${fetchUrl}`));
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject).on('timeout', () => reject(new Error('Download timeout')));
  });
}

/** Upload buffer to Cloudinary via REST API (no SDK needed) */
async function uploadToCloudinary(
  buffer: Buffer,
  productId: string,
  mimeType = 'image/jpeg'
): Promise<string> {
  const crypto = await import('crypto');
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'petshiwu/products';
  const publicId = `${folder}/${productId}`;

  // Build signature
  const sigStr = `folder=${folder}&public_id=${productId}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

  // Build multipart form data manually
  const boundary = `----FormBoundary${crypto.randomBytes(8).toString('hex')}`;
  const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
  const filename = `${productId}.${ext}`;

  let body = '';
  const addField = (name: string, value: string) => {
    body += `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
  };
  addField('api_key', API_KEY);
  addField('timestamp', String(timestamp));
  addField('signature', signature);
  addField('folder', folder);
  addField('public_id', productId);
  addField('transformation', 'w_800,h_800,c_fit,f_webp,q_85');

  const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;

  const bodyBuf = Buffer.concat([
    Buffer.from(body),
    Buffer.from(fileHeader),
    buffer,
    Buffer.from(footer)
  ]);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuf.length
      },
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', (chunk: string) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.secure_url) {
            resolve(json.secure_url);
          } else {
            reject(new Error(`Cloudinary error: ${json.error?.message || data.slice(0, 200)}`));
          }
        } catch {
          reject(new Error(`Bad Cloudinary response: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Cloudinary upload timeout')));
    req.write(bodyBuf);
    req.end();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!MONGO_URI) throw new Error('MONGODB_URI not set');
  if (!API_KEY || !API_SECRET) throw new Error('CLOUDINARY credentials not set');

  await mongoose.connect(MONGO_URI, { dbName: 'petshop' });
  const db = mongoose.connection.db;
  const col = db.collection('products');

  // ── ROLLBACK MODE ──────────────────────────────────────────────────────────
  if (ROLLBACK) {
    log('ROLLBACK MODE: removing cloudinaryImage field from all products...');
    const result = await col.updateMany(
      { cloudinaryImage: { $exists: true } },
      { $unset: { cloudinaryImage: '' } }
    );
    log(`✅ Rolled back ${result.modifiedCount} products`);
    await mongoose.disconnect();
    return;
  }

  // ── COUNT ──────────────────────────────────────────────────────────────────
  const total = await col.countDocuments({ 
    images: { $exists: true, $ne: [] },
    cloudinaryImage: { $exists: false }  // only unmigrated
  });
  const limit = TEST_ONLY ? 10 : total;
  log(`Mode: ${TEST_ONLY ? 'TEST (10 products)' : 'FULL'} | To migrate: ${limit} of ${total} remaining`);

  // ── BATCH LOOP ─────────────────────────────────────────────────────────────
  let success = 0, failed = 0, skipped = 0;
  const failures: string[] = [];

  const cursor = col.find(
    { images: { $exists: true, $ne: [] }, cloudinaryImage: { $exists: false } },
    { projection: { _id: 1, name: 1, images: 1 } }
  ).limit(limit);

  let batchCount = 0;
  for await (const product of cursor) {
    batchCount++;
    const productId = product._id.toString();
    const imageUrl: string = product.images?.[0];

    if (!imageUrl) { skipped++; continue; }

    try {
      // 1. Download
      const buffer = await downloadImage(imageUrl);
      if (buffer.length < 1000) throw new Error(`Image too small (${buffer.length} bytes) — likely error page`);

      // 2. Detect mime type from first bytes
      const isWebP = buffer[0] === 0x52 && buffer[1] === 0x49; // RIFF
      const mimeType = isWebP ? 'image/webp' : 'image/jpeg';

      // 3. Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(buffer, productId, mimeType);

      // 4. Save cloudinaryImage field (DON'T touch existing images array)
      await col.updateOne(
        { _id: product._id },
        { $set: { cloudinaryImage: cloudinaryUrl } }
      );

      success++;
      if (batchCount % 10 === 0 || TEST_ONLY) {
        log(`[${batchCount}/${limit}] ✅ ${product.name?.slice(0, 40)} → ${cloudinaryUrl.slice(0, 60)}...`);
      }
    } catch (err: any) {
      failed++;
      const msg = `FAIL [${productId}] ${product.name?.slice(0, 30)}: ${err.message}`;
      failures.push(msg);
      log(`⚠️  ${msg}`);
    }

    // Rate limit delay
    await sleep(DELAY_MS);
  }

  await mongoose.disconnect();

  log('');
  log('═══════════════════ MIGRATION SUMMARY ═══════════════════');
  log(`✅ Succeeded: ${success}`);
  log(`⚠️  Failed:    ${failed}`);
  log(`⏭️  Skipped:   ${skipped}`);
  if (failures.length > 0) {
    log('');
    log('Failed products:');
    failures.forEach(f => log(`  ${f}`));
  }
  log('═════════════════════════════════════════════════════════');
  
  if (TEST_ONLY) {
    log('');
    log('TEST COMPLETE. Check the website - if images look good, run the full migration.');
    log('To roll back test: ROLLBACK=true ts-node src/scripts/migrateImagesToCloudinary.ts');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

/**
 * migrateToBunny.mjs
 * Migrates all product images from Cloudinary to Bunny.net storage.
 * 
 * For each product:
 *   1. Download cloudinaryImage (or images[0] if no cloudinaryImage)
 *   2. Upload to Bunny storage zone as /products/{productId}.jpg
 *   3. Save bunnyImage field in MongoDB
 * 
 * Run: MONGO_URI=... BUNNY_STORAGE_PASSWORD=... node migrateToBunny.mjs
 * 
 * Resume-safe: skips products that already have bunnyImage set.
 */

import https from 'https';
import http from 'http';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const BUNNY_STORAGE_PASS = process.env.BUNNY_STORAGE_PASSWORD || 'ad8f1a46-6aa8-45fa-b07f8d43fe40-5801-4f31';
const BUNNY_STORAGE_ZONE = 'petshiwu';
const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_CDN_BASE = 'https://petshiwu-cdn.b-cdn.net';

const BATCH_SIZE = 10;    // concurrent uploads
const DELAY_MS = 200;     // ms between batches

const sleep = ms => new Promise(r => setTimeout(r, ms));

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: 20000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

function uploadToBunny(buffer, path, contentType = 'image/jpeg') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BUNNY_STORAGE_HOST,
      path: `/${BUNNY_STORAGE_ZONE}/${path}`,
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_STORAGE_PASS,
        'Content-Type': contentType,
        'Content-Length': buffer.length,
      }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode === 201) resolve(true);
        else reject(new Error(`Bunny upload ${res.statusCode}: ${body}`));
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function guessContentType(url) {
  if (url.includes('.png')) return 'image/png';
  if (url.includes('.webp')) return 'image/webp';
  if (url.includes('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function guessExt(url, contentType) {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/gif') return 'gif';
  return 'jpg';
}

async function migrateProduct(db, product) {
  const id = product._id.toString();
  
  // Pick source image: cloudinaryImage > images[0] > skip
  const sourceUrl = product.cloudinaryImage || (product.images && product.images[0]);
  if (!sourceUrl) return { id, status: 'skip', reason: 'no image' };

  try {
    const buffer = await fetchBuffer(sourceUrl);
    const contentType = guessContentType(sourceUrl);
    const ext = guessExt(sourceUrl, contentType);
    const storagePath = `products/${id}.${ext}`;
    
    await uploadToBunny(buffer, storagePath, contentType);
    
    const bunnyUrl = `${BUNNY_CDN_BASE}/${storagePath}`;
    
    await db.collection('products').updateOne(
      { _id: product._id },
      { $set: { bunnyImage: bunnyUrl } }
    );
    
    return { id, status: 'ok', url: bunnyUrl };
  } catch (err) {
    return { id, status: 'error', reason: err.message };
  }
}

async function main() {
  if (!MONGO_URI) throw new Error('MONGO_URI not set');
  
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('petshop');
  
  // Count work
  const total = await db.collection('products').countDocuments({ images: { $exists: true, $ne: [] } });
  const done = await db.collection('products').countDocuments({ bunnyImage: { $exists: true } });
  console.log(`Total products: ${total} | Already migrated: ${done} | Remaining: ${total - done}`);
  
  const cursor = db.collection('products').find(
    { bunnyImage: { $exists: false }, images: { $exists: true, $ne: [] } },
    { projection: { _id: 1, cloudinaryImage: 1, images: 1, name: 1 } }
  );
  
  let processed = 0, errors = 0, skipped = 0;
  let batch = [];
  
  for await (const product of cursor) {
    batch.push(product);
    if (batch.length >= BATCH_SIZE) {
      const results = await Promise.all(batch.map(p => migrateProduct(db, p)));
      for (const r of results) {
        if (r.status === 'ok') processed++;
        else if (r.status === 'error') { errors++; console.error(`  ❌ ${r.id}: ${r.reason}`); }
        else skipped++;
      }
      const total_done = done + processed;
      process.stdout.write(`\r  ✅ ${processed} migrated | ❌ ${errors} errors | ⏭️ ${skipped} skipped`);
      batch = [];
      await sleep(DELAY_MS);
    }
  }
  
  // Final batch
  if (batch.length > 0) {
    const results = await Promise.all(batch.map(p => migrateProduct(db, p)));
    for (const r of results) {
      if (r.status === 'ok') processed++;
      else if (r.status === 'error') { errors++; console.error(`  ❌ ${r.id}: ${r.reason}`); }
      else skipped++;
    }
  }
  
  console.log(`\n\nDone! ✅ ${processed} migrated | ❌ ${errors} errors | ⏭️ ${skipped} skipped`);
  await client.close();
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });

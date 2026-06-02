/**
 * migrateToBunny.mjs — Fast version
 * Sources from wsrv.nl (original URLs), uploads to Bunny storage
 * 50 concurrent workers, resume-safe
 */

import https from 'https';
import http from 'http';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI;
const BUNNY_STORAGE_PASS = process.env.BUNNY_STORAGE_PASSWORD || 'ad8f1a46-6aa8-45fa-b07f8d43fe40-5801-4f31';
const BUNNY_STORAGE_ZONE = 'petshiwu';
const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_CDN_BASE = 'https://petshiwu-cdn.b-cdn.net';

const CONCURRENCY = 50;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function fetchBuffer(url, redirects = 0) {
  if (redirects > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: 15000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function uploadToBunny(buffer, path, contentType = 'image/jpeg') {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: BUNNY_STORAGE_HOST,
      path: `/${BUNNY_STORAGE_ZONE}/${path}`,
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_STORAGE_PASS,
        'Content-Type': contentType,
        'Content-Length': buffer.length,
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => res.statusCode === 201 ? resolve() : reject(new Error(`${res.statusCode}: ${body}`)));
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function getSourceUrl(product) {
  // Prefer original wsrv.nl URLs (avoid dying Cloudinary)
  const imgs = product.images || [];
  const wsrv = imgs.find(u => u && u.includes('wsrv.nl'));
  if (wsrv) return wsrv;
  // Fall back to first image (could be cloudinary — grab before it dies)
  if (imgs[0]) return imgs[0];
  return null;
}

async function migrateOne(db, product) {
  const id = product._id.toString();
  const sourceUrl = getSourceUrl(product);
  if (!sourceUrl) return 'skip';
  try {
    const buffer = await fetchBuffer(sourceUrl);
    if (buffer.length < 100) return 'skip'; // empty/invalid
    const ext = sourceUrl.includes('.png') ? 'png' : sourceUrl.includes('.webp') ? 'webp' : 'jpg';
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const storagePath = `products/${id}.${ext}`;
    await uploadToBunny(buffer, storagePath, contentType);
    const bunnyUrl = `${BUNNY_CDN_BASE}/${storagePath}`;
    await db.collection('products').updateOne({ _id: product._id }, { $set: { bunnyImage: bunnyUrl } });
    return 'ok';
  } catch (e) {
    return `error: ${e.message.substring(0, 60)}`;
  }
}

async function runBatch(db, products) {
  return Promise.all(products.map(p => migrateOne(db, p)));
}

async function main() {
  if (!MONGO_URI) throw new Error('MONGO_URI not set');
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('petshop');

  const total = await db.collection('products').countDocuments({ images: { $exists: true, $ne: [] } });
  const done = await db.collection('products').countDocuments({ bunnyImage: { $exists: true } });
  const remaining = total - done;
  console.log(`Total: ${total} | Already done: ${done} | To migrate: ${remaining}`);
  if (remaining === 0) { console.log('Nothing to do!'); await client.close(); return; }

  const cursor = db.collection('products').find(
    { bunnyImage: { $exists: false }, images: { $exists: true, $ne: [] } },
    { projection: { _id: 1, images: 1 } }
  );

  let ok = 0, errors = 0, skipped = 0;
  let batch = [];
  const start = Date.now();

  for await (const product of cursor) {
    batch.push(product);
    if (batch.length >= CONCURRENCY) {
      const results = await runBatch(db, batch);
      for (const r of results) {
        if (r === 'ok') ok++;
        else if (r === 'skip') skipped++;
        else { errors++; }
      }
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      const rate = ok / Math.max(1, elapsed);
      const eta = remaining > 0 ? Math.round((remaining - ok) / Math.max(rate, 0.1)) : 0;
      process.stdout.write(`\r✅ ${ok} | ❌ ${errors} | ⏭ ${skipped} | ${elapsed}s elapsed | ETA: ${eta}s    `);
      batch = [];
    }
  }
  if (batch.length > 0) {
    const results = await runBatch(db, batch);
    for (const r of results) {
      if (r === 'ok') ok++;
      else if (r === 'skip') skipped++;
      else errors++;
    }
  }

  console.log(`\n\nDONE ✅ ${ok} migrated | ❌ ${errors} errors | ⏭ ${skipped} skipped`);
  await client.close();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

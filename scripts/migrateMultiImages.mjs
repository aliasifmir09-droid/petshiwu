/**
 * scripts/migrateMultiImages.mjs — Multi-image migration
 * Grabs ALL PetSmart images per product, uploads to Bunny, saves array to MongoDB.
 * Naming: {_id}.jpg (primary), {_id}-2.jpg, {_id}-3.jpg, etc.
 * Skip: products whose MongoDB images field already has >=2 Bunny CDN URLs.
 */

import https from 'https';
import { MongoClient } from 'mongodb';

const BUNNY_PASS = process.env.BUNNY_STORAGE_PASSWORD || 'ad8f1a46-6aa8-45fa-b07f8d43fe40-5801-4f31';
const BUNNY_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_ZONE = 'petshiwu';
const CDN_BASE = 'https://petshiwu-cdn.b-cdn.net/products';
const MONGO_URI = process.env.MONGODB_URI;
const PAGE_SIZE = 50;
const CONCURRENCY = 8;

const UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
];
const ua = () => UAS[Math.floor(Math.random() * UAS.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));

function get(url, headers = {}, redirects = 0) {
  if (redirects > 6) return Promise.reject(new Error('too many redirects'));
  return new Promise((resolve, reject) => {
    const p = new URL(url);
    const req = https.get({
      hostname: p.hostname, path: p.pathname + p.search, timeout: 25000,
      headers: { 'User-Agent': ua(), Accept: '*/*', ...headers },
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http') ? res.headers.location : `https://${p.hostname}${res.headers.location}`;
        return get(next, headers, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode === 404) return reject(new Error('HTTP404'));
      if (res.statusCode === 429) return reject(new Error('RATE429'));
      if (res.statusCode !== 200) return reject(new Error(`HTTP${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function upload(buf, filename) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: BUNNY_HOST, path: `/${BUNNY_ZONE}/products/${filename}`,
      method: 'PUT',
      headers: { AccessKey: BUNNY_PASS, 'Content-Type': 'image/jpeg', 'Content-Length': buf.length },
    }, res => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => res.statusCode === 201 ? resolve() : reject(new Error(`Bunny${res.statusCode}`)));
    });
    req.on('error', reject);
    req.write(buf); req.end();
  });
}

async function processOne(db, id, name, existingImages) {
  // Skip if already has multiple Bunny CDN URLs in MongoDB
  const bunnyImages = (existingImages || []).filter(u => u && u.includes('b-cdn.net'));
  if (bunnyImages.length >= 2) return 'skip';

  try {
    await sleep(300 + Math.random() * 400);
    const q = encodeURIComponent(name.substring(0, 60));
    const html = (await get(
      `https://www.petsmart.com/search/?q=${q}&format=ajax`,
      { Referer: 'https://www.petsmart.com/', 'X-Requested-With': 'XMLHttpRequest' }
    )).toString('utf8');

    // Collect all unique scene7 IDs
    const seen = new Set();
    const scene7Ids = [];
    for (const m of html.matchAll(/scene7\.com\/is\/image\/PetSmart\/(\d{5,10})/g)) {
      if (!seen.has(m[1])) { seen.add(m[1]); scene7Ids.push(m[1]); }
    }
    if (!scene7Ids.length) return 'nomatch';

    // Download all valid images
    const validBuffers = [];
    for (const s7id of scene7Ids) {
      try {
        const buf = await get(`https://s7d2.scene7.com/is/image/PetSmart/${s7id}?wid=800&hei=800&fmt=jpeg&qlt=90`);
        if (buf.length >= 20000) validBuffers.push(buf);
      } catch { continue; }
      await sleep(100);
    }
    if (!validBuffers.length) return 'nomatch';

    // Upload: primary = {id}.jpg, extras = {id}-2.jpg, {id}-3.jpg, ...
    const cdnUrls = [];
    for (let i = 0; i < validBuffers.length; i++) {
      const filename = i === 0 ? `${id}.jpg` : `${id}-${i + 1}.jpg`;
      try {
        await upload(validBuffers[i], filename);
        cdnUrls.push(`${CDN_BASE}/${filename}`);
      } catch (e) {
        if (i === 0) return `err:upload_primary_${e.message.substring(0, 30)}`;
        // Extra image failed — skip it, don't fail the whole product
      }
    }

    // Save to MongoDB
    await db.collection('products').updateOne(
      { _id: id },
      { $set: { images: cdnUrls } }
    );

    return `ok:${cdnUrls.length}`;
  } catch (e) {
    if (e.message === 'HTTP404') return 'nomatch';
    if (e.message === 'RATE429') await sleep(15000);
    return `err:${e.message.substring(0, 40)}`;
  }
}

async function main() {
  if (!MONGO_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
  await client.connect();
  console.log('Connected.');

  const db = client.db('petshop');
  const total = await db.collection('products').countDocuments();
  const totalPages = Math.ceil(total / PAGE_SIZE);
  console.log(`Total products: ${total} | Pages: ${totalPages}\n`);

  let ok = 0, skip = 0, nomatch = 0, errors = 0, totalImgs = 0;
  const start = Date.now();

  for (let page = 1; page <= totalPages; page++) {
    const products = await db.collection('products')
      .find({}, { projection: { _id: 1, name: 1, images: 1 } })
      .skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).toArray();

    for (let i = 0; i < products.length; i += CONCURRENCY) {
      const batch = products.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(p => processOne(db, p._id, p.name || '', p.images || []))
      );
      for (const r of results) {
        if (r === 'skip') skip++;
        else if (r === 'nomatch') nomatch++;
        else if (r.startsWith('ok:')) { ok++; totalImgs += parseInt(r.split(':')[1]) || 1; }
        else errors++;
      }
    }

    const mins = ((Date.now() - start) / 60000).toFixed(1);
    const done = page * PAGE_SIZE;
    const rate = done / Math.max((Date.now() - start) / 1000, 1);
    const eta = Math.round((total - done) / Math.max(rate, 0.01) / 60);
    console.log(`p${page}/${totalPages} | ✅${ok}(${totalImgs}imgs) ⏭${skip} ⚠️${nomatch} ❌${errors} | ${mins}min | ETA~${eta}min`);
  }

  await client.close();
  console.log(`\nDONE — ✅${ok} products updated | ${totalImgs} total images | ⏭${skip} skipped | ⚠️${nomatch} no match | ❌${errors} errors`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

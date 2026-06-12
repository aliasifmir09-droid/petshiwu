/**
 * scripts/migrateImages.mjs — Render Job
 * Connects to MongoDB directly, searches PetSmart, uploads to Bunny.
 * Resume-safe via Bunny HEAD check.
 */

import https from 'https';
import { MongoClient } from 'mongodb';

const BUNNY_PASS = process.env.BUNNY_STORAGE_PASSWORD || 'ad8f1a46-6aa8-45fa-b07f8d43fe40-5801-4f31';
const BUNNY_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_ZONE = 'petshiwu';
const MONGO_URI = process.env.MONGODB_URI;
const PAGE_SIZE = 100;
const CONCURRENCY = 15;

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

// Fetches all existing product IDs from Bunny storage in one call
async function loadDoneIds() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: BUNNY_HOST, path: `/${BUNNY_ZONE}/products/`,
      method: 'GET', headers: { AccessKey: BUNNY_PASS }, timeout: 30000,
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const list = JSON.parse(Buffer.concat(chunks).toString());
          const ids = new Set(list.map(f => f.ObjectName.replace('.jpg', '')));
          resolve(ids);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout loading Bunny list')); });
    req.end();
  });
}

function upload(buf, id) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: BUNNY_HOST, path: `/${BUNNY_ZONE}/products/${id}.jpg`,
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

let doneIds = new Set();

async function processOne(id, name) {
  if (doneIds.has(id)) return 'skip';
  try {
    await sleep(300 + Math.random() * 300);
    const q = encodeURIComponent(name.substring(0, 60));
    const html = (await get(`https://www.petsmart.com/search/?q=${q}&format=ajax`,
      { Referer: 'https://www.petsmart.com/', 'X-Requested-With': 'XMLHttpRequest' }
    )).toString('utf8');
    const matches = [...html.matchAll(/scene7\.com\/is\/image\/PetSmart\/(\d{5,10})/g)];
    if (!matches.length) return 'nomatch';
    for (const m of matches) {
      try {
        const buf = await get(`https://s7d2.scene7.com/is/image/PetSmart/${m[1]}?wid=800&hei=800&fmt=jpeg&qlt=90`);
        if (buf.length < 20000) continue;
        await upload(buf, id);
        return 'ok';
      } catch { continue; }
    }
    return 'nomatch';
  } catch (e) {
    if (e.message === 'HTTP404') return 'nomatch';
    if (e.message === 'RATE429') await sleep(15000);
    return `err:${e.message.substring(0, 40)}`;
  }
}

async function main() {
  if (!MONGO_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

  console.log('Loading existing Bunny images...');
  doneIds = await loadDoneIds();
  console.log(`Already in Bunny: ${doneIds.size}`);

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
  await client.connect();
  console.log('Connected.');

  const db = client.db('petshop');
  const total = await db.collection('products').countDocuments();
  const totalPages = Math.ceil(total / PAGE_SIZE);
  console.log(`Total products: ${total} | Pages: ${totalPages}\n`);

  let ok = 0, skip = 0, nomatch = 0, errors = 0;
  const start = Date.now();

  for (let page = 1; page <= totalPages; page++) {
    const products = await db.collection('products')
      .find({}, { projection: { _id: 1, name: 1 } })
      .skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).toArray();

    for (let i = 0; i < products.length; i += CONCURRENCY) {
      const batch = products.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(p => processOne(String(p._id), p.name || '')));
      for (const r of results) {
        if (r === 'ok') ok++;
        else if (r === 'skip') skip++;
        else if (r === 'nomatch') nomatch++;
        else errors++;
      }
    }

    const mins = ((Date.now() - start) / 60000).toFixed(1);
    const done = (page * PAGE_SIZE);
    const rate = done / Math.max((Date.now() - start) / 1000, 1);
    const eta = Math.round((total - done) / Math.max(rate, 0.01) / 60);
    console.log(`p${page}/${totalPages} | ✅${ok} ⏭${skip} ⚠️${nomatch} ❌${errors} | ${mins}min elapsed | ETA~${eta}min`);
  }

  await client.close();
  console.log(`\nDONE — ✅${ok} uploaded | ⏭${skip} skipped | ⚠️${nomatch} no match | ❌${errors} errors`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

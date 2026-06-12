/**
 * scripts/migrateImages.mjs — Render Cron Job
 *
 * Run as a Render one-off job or cron.
 * Searches PetSmart for each product, uploads image directly to Bunny storage.
 * Resume-safe: HEAD-checks Bunny before each product.
 *
 * Usage: node scripts/migrateImages.mjs
 * Env: MONGODB_URI, BUNNY_STORAGE_PASSWORD (optional, hardcoded fallback)
 */

import https from 'https';
import http from 'http';
import { MongoClient } from 'mongodb';

const BUNNY_STORAGE_PASS = process.env.BUNNY_STORAGE_PASSWORD || 'ad8f1a46-6aa8-45fa-b07f8d43fe40-5801-4f31';
const BUNNY_STORAGE_ZONE = 'petshiwu';
const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_CDN_BASE = 'https://petshiwu-cdn.b-cdn.net';
const CONCURRENCY = 10;
const PAGE_SIZE = 100;

const UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
];
const ua = () => UAS[Math.floor(Math.random() * UAS.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));

function fetchRaw(url, headers = {}, redirects = 0) {
  if (redirects > 6) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const p = new URL(url);
    const proto = p.protocol === 'https:' ? https : http;
    const req = proto.get({
      hostname: p.hostname, path: p.pathname + p.search, timeout: 20000,
      headers: {
        'User-Agent': ua(), Accept: 'text/html,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        ...headers,
      },
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${p.protocol}//${p.hostname}${res.headers.location}`;
        return fetchRaw(next, headers, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode === 429) return reject(new Error('RATE429'));
      if (res.statusCode === 404) return reject(new Error('HTTP404'));
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

function headBunny(id) {
  return new Promise(resolve => {
    const req = https.request({
      hostname: BUNNY_STORAGE_HOST,
      path: `/${BUNNY_STORAGE_ZONE}/products/${id}.jpg`,
      method: 'HEAD',
      headers: { AccessKey: BUNNY_STORAGE_PASS },
      timeout: 8000,
    }, res => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

function uploadBunny(buf, id) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: BUNNY_STORAGE_HOST,
      path: `/${BUNNY_STORAGE_ZONE}/products/${id}.jpg`,
      method: 'PUT',
      headers: {
        AccessKey: BUNNY_STORAGE_PASS,
        'Content-Type': 'image/jpeg',
        'Content-Length': buf.length,
      },
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => res.statusCode === 201 ? resolve() : reject(new Error(`Bunny${res.statusCode}`)));
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

async function processOne(id, name) {
  if (await headBunny(id)) return 'skip';
  try {
    await sleep(300 + Math.random() * 400);
    const query = encodeURIComponent(name.substring(0, 60));
    const html = (await fetchRaw(
      `https://www.petsmart.com/search/?q=${query}&format=ajax`,
      { Referer: 'https://www.petsmart.com/', 'X-Requested-With': 'XMLHttpRequest' }
    )).toString('utf8');
    const m = [...html.matchAll(/scene7\.com\/is\/image\/PetSmart\/(\d{5,10})/g)];
    if (!m.length) return 'nomatch';

    // Try each scene7 ID — first matches are often banner ads (will 404)
    for (const match of m) {
      try {
        const imgUrl = `https://s7d2.scene7.com/is/image/PetSmart/${match[1]}?wid=800&hei=800&fmt=jpeg&qlt=90`;
        const buf = await fetchRaw(imgUrl);
        if (buf.length < 500) continue;
        await uploadBunny(buf, id);
        return 'ok';
      } catch { continue; }
    }
    return 'nomatch';
  } catch (e) {
    if (e.message === 'RATE429') await sleep(12000);
    if (e.message === 'HTTP404' || e.message === 'HTTP0') return 'nomatch';
    return `err:${e.message.substring(0, 50)}`;
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const db = client.db('petshop');

  let ok = 0, skip = 0, nomatch = 0, errors = 0;
  const start = Date.now();
  let page = 1, totalPages = 1;

  while (page <= totalPages) {
    const skip_n = (page - 1) * PAGE_SIZE;
    const products = await db.collection('products')
      .find({}, { projection: { _id: 1, name: 1 } })
      .skip(skip_n).limit(PAGE_SIZE).toArray();

    if (page === 1) {
      const total = await db.collection('products').countDocuments();
      totalPages = Math.ceil(total / PAGE_SIZE);
    }

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

    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    const done = ok + skip + nomatch + errors;
    const total = totalPages * PAGE_SIZE;
    const rate = done / Math.max(elapsed, 1);
    const eta = Math.round((total - done) / Math.max(rate, 0.01) / 60);
    console.log(`p${page}/${totalPages} | ✅${ok} ⏭${skip} ⚠️${nomatch} ❌${errors} | ETA~${eta}min`);
    page++;
  }

  const mins = ((Date.now() - start) / 60000).toFixed(1);
  console.log(`\nDONE in ${mins}min — ✅${ok} | ⏭${skip} | ⚠️${nomatch} | ❌${errors}`);
  await client.close();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

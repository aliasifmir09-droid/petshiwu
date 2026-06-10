/**
 * recoverImages.mjs
 *
 * Gets products from the petshiwu public API, searches PetSmart for each image,
 * downloads into memory, uploads directly to Bunny storage.
 * No external URLs stored anywhere. No MongoDB connection needed.
 *
 * Usage: node recoverImages.mjs
 * Resume-safe: skips products already in Bunny storage (HEAD check).
 */

import https from 'https';
import http from 'http';

const BUNNY_STORAGE_PASS = 'ad8f1a46-6aa8-45fa-b07f8d43fe40-5801-4f31';
const BUNNY_STORAGE_ZONE = 'petshiwu';
const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_CDN_BASE = 'https://petshiwu-cdn.b-cdn.net';
const API_BASE = 'https://www.petshiwu.com/api';
const PAGE_SIZE = 100;
const CONCURRENCY = 6;
const SEARCH_DELAY_MS = 150;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function fetchRaw(url, extraHeaders = {}, redirects = 0) {
  if (redirects > 6) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const proto = parsed.protocol === 'https:' ? https : http;
    const req = proto.get({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': '*/*',
        ...extraHeaders,
      },
      timeout: 20000,
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsed.protocol}//${parsed.hostname}${res.headers.location}`;
        return fetchRaw(next, extraHeaders, redirects + 1).then(resolve).catch(reject);
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

async function headRequest(hostname, path, headers) {
  return new Promise((resolve) => {
    const req = https.request({ hostname, path, method: 'HEAD', headers, timeout: 8000 }, res => {
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(0));
    req.on('timeout', () => { req.destroy(); resolve(0); });
    req.end();
  });
}

// ── Fetch all products from public API ───────────────────────────────────────

async function fetchAllProducts() {
  const products = [];
  let page = 1;
  let totalPages = 1;

  console.log('Fetching product list from API...');
  while (page <= totalPages) {
    const url = `${API_BASE}/products?limit=${PAGE_SIZE}&page=${page}&fields=_id,name`;
    const buf = await fetchRaw(url);
    const data = JSON.parse(buf.toString('utf8'));
    const batch = data.data || [];
    products.push(...batch.map(p => ({ id: String(p._id), name: p.name })));
    totalPages = data.pagination?.pages || 1;
    process.stdout.write(`\r  Fetched page ${page}/${totalPages} (${products.length} products)`);
    page++;
  }
  console.log(`\nLoaded ${products.length} products.\n`);
  return products;
}

// ── Check if already uploaded ─────────────────────────────────────────────────

async function alreadyUploaded(id) {
  const status = await headRequest(
    BUNNY_STORAGE_HOST,
    `/${BUNNY_STORAGE_ZONE}/products/${id}.jpg`,
    { AccessKey: BUNNY_STORAGE_PASS }
  );
  return status === 200;
}

// ── PetSmart image search ─────────────────────────────────────────────────────

async function findPetSmartImage(productName) {
  const query = encodeURIComponent(productName.substring(0, 80));
  const url = `https://www.petsmart.com/search/?q=${query}&format=ajax`;
  const html = (await fetchRaw(url)).toString('utf8');
  const matches = [...html.matchAll(/scene7\.com\/is\/image\/PetSmart\/(\d{5,10})/g)];
  if (!matches.length) return null;
  return `https://s7d2.scene7.com/is/image/PetSmart/${matches[0][1]}?wid=500&hei=500&fmt=jpeg&qlt=85`;
}

// ── Bunny upload ──────────────────────────────────────────────────────────────

function uploadToBunny(buffer, path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: BUNNY_STORAGE_HOST,
      path: `/${BUNNY_STORAGE_ZONE}/${path}`,
      method: 'PUT',
      headers: {
        AccessKey: BUNNY_STORAGE_PASS,
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length,
      },
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => res.statusCode === 201 ? resolve() : reject(new Error(`Bunny ${res.statusCode}: ${body}`)));
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

// ── Per-product ───────────────────────────────────────────────────────────────

async function processOne(product) {
  try {
    if (await alreadyUploaded(product.id)) return 'skip';

    await sleep(SEARCH_DELAY_MS + Math.random() * 100);

    const imgUrl = await findPetSmartImage(product.name);
    if (!imgUrl) return 'no_match';

    const buffer = await fetchRaw(imgUrl);
    if (buffer.length < 500) return 'too_small';

    await uploadToBunny(buffer, `products/${product.id}.jpg`);
    return 'ok';
  } catch (e) {
    return `err:${e.message.substring(0, 60)}`;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const products = await fetchAllProducts();
  const total = products.length;
  let ok = 0, skipped = 0, noMatch = 0, errors = 0;
  const start = Date.now();

  for (let i = 0; i < total; i += CONCURRENCY) {
    const batch = products.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(processOne));
    for (const r of results) {
      if (r === 'ok') ok++;
      else if (r === 'skip') skipped++;
      else if (r === 'no_match' || r === 'too_small') noMatch++;
      else errors++;
    }
    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    const done = ok + skipped + noMatch + errors;
    const rate = done / Math.max(1, elapsed);
    const eta = rate > 0 ? Math.round((total - done) / rate) : '?';
    process.stdout.write(`\r✅ ${ok} uploaded | ⏭ ${skipped} skipped | ⚠️ ${noMatch} no match | ❌ ${errors} errors | ETA: ${eta}s   `);
  }

  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log(`\n\nDONE in ${elapsed} min — ✅ ${ok} | ⏭ ${skipped} | ⚠️ ${noMatch} | ❌ ${errors}`);
}

main().catch(e => { console.error('\nFatal:', e.message); process.exit(1); });

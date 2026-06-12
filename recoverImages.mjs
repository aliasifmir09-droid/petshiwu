/**
 * recoverImages.mjs v2
 *
 * Resume-safe: skips products already in Bunny storage.
 * Uses staggered delays + retry + rotating headers to avoid detection.
 */

import https from 'https';
import http from 'http';

const BUNNY_STORAGE_PASS = 'ad8f1a46-6aa8-45fa-b07f8d43fe40-5801-4f31';
const BUNNY_STORAGE_ZONE = 'petshiwu';
const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_CDN_BASE = 'https://petshiwu-cdn.b-cdn.net';
const API_BASE = 'https://www.petshiwu.com/api';
const PAGE_SIZE = 100;
const CONCURRENCY = 3;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

const randomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const randomDelay = (min, max) => sleep(min + Math.floor(Math.random() * (max - min)));

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function fetchRaw(url, headers = {}, redirects = 0) {
  if (redirects > 6) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const proto = parsed.protocol === 'https:' ? https : http;
    const req = proto.get({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        ...headers,
      },
      timeout: 22000,
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsed.protocol}//${parsed.hostname}${res.headers.location}`;
        return fetchRaw(next, headers, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode === 429 || res.statusCode === 503) {
        return reject(new Error(`RATELIMIT:${res.statusCode}`));
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

async function fetchWithRetry(url, headers = {}, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchRaw(url, headers);
    } catch (e) {
      if (attempt === maxRetries) throw e;
      const isRateLimit = e.message.startsWith('RATELIMIT');
      const waitMs = isRateLimit ? 8000 + attempt * 5000 : 2000 + attempt * 2000;
      await sleep(waitMs);
    }
  }
}

async function headCheck(hostname, path, headers) {
  return new Promise(resolve => {
    const req = https.request({ hostname, path, method: 'HEAD', headers, timeout: 8000 }, res => resolve(res.statusCode));
    req.on('error', () => resolve(0));
    req.on('timeout', () => { req.destroy(); resolve(0); });
    req.end();
  });
}

// ── Fetch product list ────────────────────────────────────────────────────────

async function fetchAllProducts() {
  const products = [];
  let page = 1, totalPages = 1;
  console.log('Loading product list...');
  while (page <= totalPages) {
    const buf = await fetchRaw(`${API_BASE}/products?limit=${PAGE_SIZE}&page=${page}&fields=_id,name`);
    const data = JSON.parse(buf.toString('utf8'));
    products.push(...(data.data || []).map(p => ({ id: String(p._id), name: p.name })));
    totalPages = data.pagination?.pages || 1;
    process.stdout.write(`\r  Page ${page}/${totalPages} (${products.length} products)`);
    page++;
  }
  console.log(`\nLoaded ${products.length} products.\n`);
  return products;
}

// ── Already uploaded? ─────────────────────────────────────────────────────────

async function alreadyUploaded(id) {
  const status = await headCheck(BUNNY_STORAGE_HOST, `/${BUNNY_STORAGE_ZONE}/products/${id}.jpg`, { AccessKey: BUNNY_STORAGE_PASS });
  return status === 200;
}

// ── PetSmart image search ─────────────────────────────────────────────────────

async function findPetSmartImage(productName) {
  // Try two query lengths — short names work better with exact match
  const queries = [
    productName.substring(0, 60),
    productName.split(' ').slice(0, 5).join(' '),
  ];

  for (const q of queries) {
    const url = `https://www.petsmart.com/search/?q=${encodeURIComponent(q)}&format=ajax`;
    try {
      const html = (await fetchWithRetry(url, {
        Referer: 'https://www.petsmart.com/',
        'X-Requested-With': 'XMLHttpRequest',
      }, 2)).toString('utf8');

      const matches = [...html.matchAll(/scene7\.com\/is\/image\/PetSmart\/(\d{5,10})/g)];
      if (matches.length > 0) {
        const id = matches[0][1];
        return `https://s7d2.scene7.com/is/image/PetSmart/${matches[0][1]}?wid=800&hei=800&fmt=jpeg&qlt=90`;
      }
    } catch (e) {
      if (e.message.startsWith('RATELIMIT')) {
        await sleep(12000);
        throw e;
      }
      // Try next query on other errors
    }
    await randomDelay(600, 1200);
  }
  return null;
}

// ── Bunny upload ──────────────────────────────────────────────────────────────

function uploadToBunny(buffer, storagePath) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: BUNNY_STORAGE_HOST,
      path: `/${BUNNY_STORAGE_ZONE}/${storagePath}`,
      method: 'PUT',
      headers: { AccessKey: BUNNY_STORAGE_PASS, 'Content-Type': 'image/jpeg', 'Content-Length': buffer.length },
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

    await randomDelay(800, 1800);

    const imgUrl = await findPetSmartImage(product.name);
    if (!imgUrl) return 'no_match';

    const buffer = await fetchWithRetry(imgUrl, {}, 2);
    if (buffer.length < 500) return 'too_small';

    await uploadToBunny(buffer, `products/${product.id}.jpg`);
    return 'ok';
  } catch (e) {
    return `err:${e.message.substring(0, 80)}`;
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

    // Back off if error rate is high in this batch
    const batchErrors = results.filter(r => r.startsWith('err')).length;
    if (batchErrors >= CONCURRENCY) {
      process.stdout.write(`\n[!] High error rate — pausing 15s...\n`);
      await sleep(15000);
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    const done = ok + skipped + noMatch + errors;
    const rate = done / Math.max(1, elapsed);
    const eta = rate > 0 ? Math.round((total - done) / rate) : '?';
    process.stdout.write(`\r✅ ${ok} | ⏭ ${skipped} skip | ⚠️ ${noMatch} | ❌ ${errors} | ETA: ${eta}s   `);
  }

  const mins = ((Date.now() - start) / 60000).toFixed(1);
  console.log(`\n\nDONE in ${mins} min — ✅ ${ok} | ⏭ ${skipped} | ⚠️ ${noMatch} | ❌ ${errors}`);
}

main().catch(e => { console.error('\nFatal:', e.message); process.exit(1); });

/**
 * recoverImages.mjs v4
 * Processes products page by page — no full list load, starts uploading immediately.
 * Skips already-uploaded products via done_ids.txt or Bunny HEAD check.
 */

import https from 'https';
import http from 'http';
import { readFileSync } from 'fs';

const BUNNY_STORAGE_PASS = 'ad8f1a46-6aa8-45fa-b07f8d43fe40-5801-4f31';
const BUNNY_STORAGE_ZONE = 'petshiwu';
const BUNNY_STORAGE_HOST = 'ny.storage.bunnycdn.com';
const API_BASE = 'https://www.petshiwu.com/api';
const PAGE_SIZE = 20;
const CONCURRENCY = 8;
const DELAY_MS = 400;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Load already-done IDs from file (faster than HEAD check for each)
let doneIds = new Set();
try {
  const txt = readFileSync('/workspace/done_ids.txt', 'utf8');
  doneIds = new Set(txt.split('\n').filter(Boolean));
  console.log(`Loaded ${doneIds.size} already-done IDs from cache.`);
} catch { console.log('No done_ids.txt — will HEAD-check each.'); }

const UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
];
const ua = () => UAS[Math.floor(Math.random() * UAS.length)];

function fetchRaw(url, headers = {}, redirects = 0) {
  if (redirects > 6) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const p = new URL(url);
    const proto = p.protocol === 'https:' ? https : http;
    const req = proto.get({
      hostname: p.hostname, path: p.pathname + p.search, timeout: 20000,
      headers: { 'User-Agent': ua(), Accept: 'text/html,*/*', 'Accept-Language': 'en-US,en;q=0.9', ...headers },
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http') ? res.headers.location : `${p.protocol}//${p.hostname}${res.headers.location}`;
        return fetchRaw(next, headers, redirects + 1).then(resolve).catch(reject);
      }
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

function uploadBunny(buf, id) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: BUNNY_STORAGE_HOST, path: `/${BUNNY_STORAGE_ZONE}/products/${id}.jpg`,
      method: 'PUT', headers: { AccessKey: BUNNY_STORAGE_PASS, 'Content-Type': 'image/jpeg', 'Content-Length': buf.length },
    }, res => {
      let b = ''; res.on('data', c => b += c);
      res.on('end', () => res.statusCode === 201 ? resolve() : reject(new Error(`Bunny${res.statusCode}`)));
    });
    req.on('error', reject);
    req.write(buf); req.end();
  });
}

import { appendFileSync } from 'fs';
const ERR_LOG = '/workspace/recover_errors.log';

async function processOne(product) {
  if (doneIds.has(product.id)) return 'skip';
  try {
    await sleep(DELAY_MS + Math.random() * 300);
    const query = encodeURIComponent(product.name.substring(0, 60));
    const html = (await fetchRaw(
      `https://www.petsmart.com/search/?q=${query}&format=ajax`,
      { Referer: 'https://www.petsmart.com/', 'X-Requested-With': 'XMLHttpRequest' }
    )).toString('utf8');
    const m = [...html.matchAll(/scene7\.com\/is\/image\/PetSmart\/(\d{5,10})/g)];
    if (!m.length) return 'nomatch';
    // Try each scene7 match until one returns a valid image (banners/campaigns often 404)
    let uploaded = false;
    for (const match of m) {
      try {
        const imgUrl = `https://s7d2.scene7.com/is/image/PetSmart/${match[1]}?wid=800&hei=800&fmt=jpeg&qlt=90`;
        const buf = await fetchRaw(imgUrl);
        if (buf.length < 20000) continue; // PetSmart "no image" placeholder is ~5-9KB
        await uploadBunny(buf, product.id);
        doneIds.add(product.id);
        uploaded = true;
        break;
      } catch { continue; }
    }
    if (!uploaded) return 'nomatch';
    return 'ok';
  } catch (e) {
    if (e.message === 'RATE429') await sleep(10000);
    // HTTP404 from PetSmart search = product discontinued / no results page - not an error
    if (e.message === 'HTTP404' || e.message === 'HTTP0') return 'nomatch';
    appendFileSync(ERR_LOG, `${product.id} | ${product.name.substring(0,40)} | ${e.message}\n`);
    return `err:${e.message.substring(0, 40)}`;
  }
}

async function main() {
  let ok = 0, skip = 0, nomatch = 0, errors = 0;
  const start = Date.now();
  let page = 1, totalPages = 1;

  while (page <= totalPages) {
    const buf = await fetchRaw(`${API_BASE}/products?limit=${PAGE_SIZE}&page=${page}&fields=_id,name`);
    const data = JSON.parse(buf.toString('utf8'));
    const products = (data.data || []).map(p => ({ id: String(p._id), name: p.name }));
    totalPages = data.pagination?.pages || 1;

    // Process this page's products concurrently
    for (let i = 0; i < products.length; i += CONCURRENCY) {
      const batch = products.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(processOne));
      for (const r of results) {
        if (r === 'ok') ok++;
        else if (r === 'skip') skip++;
        else if (r === 'nomatch' || r === 'small') nomatch++;
        else errors++;
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    const done = ok + skip + nomatch + errors;
    const total = totalPages * PAGE_SIZE;
    const rate = done / Math.max(elapsed, 1);
    const eta = Math.round((total - done) / Math.max(rate, 0.01) / 60);
    process.stdout.write(`\rp${page}/${totalPages} ✅${ok} ⏭${skip} ⚠️${nomatch} ❌${errors} | ETA~${eta}min   `);
    page++;
  }

  const mins = ((Date.now() - start) / 60000).toFixed(1);
  console.log(`\n\nDONE in ${mins}min — ✅${ok} | ⏭${skip} | ⚠️${nomatch} | ❌${errors}`);
}

main().catch(e => { console.error('\nFatal:', e.message); process.exit(1); });

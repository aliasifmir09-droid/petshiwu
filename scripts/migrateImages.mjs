/**
 * scripts/migrateImages.mjs — Render Job
 * Uses the petshiwu public API (no MongoDB needed), uploads to Bunny directly.
 */

import https from 'https';

const BUNNY_PASS = process.env.BUNNY_STORAGE_PASSWORD || 'ad8f1a46-6aa8-45fa-b07f8d43fe40-5801-4f31';
const BUNNY_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_ZONE = 'petshiwu';
const API_BASE = 'https://www.petshiwu.com/api';
const PAGE_SIZE = 20;
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
      hostname: BUNNY_HOST, path: `/${BUNNY_ZONE}/products/${id}.jpg`,
      method: 'HEAD', headers: { AccessKey: BUNNY_PASS }, timeout: 8000,
    }, res => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
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

async function processOne(id, name) {
  if (await headBunny(id)) return 'skip';
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
  let ok = 0, skip = 0, nomatch = 0, errors = 0;
  const start = Date.now();
  let page = 1, totalPages = 1;

  while (page <= totalPages) {
    const data = JSON.parse((await get(`${API_BASE}/products?limit=${PAGE_SIZE}&page=${page}&fields=_id,name`)).toString());
    const products = (data.data || []).map(p => ({ id: String(p._id), name: p.name }));
    totalPages = data.pagination?.pages || 1;

    for (let i = 0; i < products.length; i += CONCURRENCY) {
      const batch = products.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(p => processOne(p.id, p.name)));
      for (const r of results) {
        if (r === 'ok') ok++;
        else if (r === 'skip') skip++;
        else if (r === 'nomatch') nomatch++;
        else errors++;
      }
    }

    const mins = ((Date.now() - start) / 60000).toFixed(1);
    const done = ok + skip + nomatch + errors;
    const rate = done / Math.max((Date.now() - start) / 1000, 1);
    const eta = Math.round((totalPages * PAGE_SIZE - done) / Math.max(rate, 0.01) / 60);
    console.log(`p${page}/${totalPages} | ✅${ok} ⏭${skip} ⚠️${nomatch} ❌${errors} | ${mins}min | ETA~${eta}min`);
    page++;
  }

  console.log(`\nDONE — ✅${ok} uploaded | ⏭${skip} skipped | ⚠️${nomatch} no match | ❌${errors} errors`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

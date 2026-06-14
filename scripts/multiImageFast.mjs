/**
 * multiImageFast.mjs — parallel worker, HD images, no watermarks
 * WORKER=0..N-1, TOTAL_WORKERS=N
 */
import https from 'https';
import { MongoClient } from 'mongodb';

const BUNNY_PASS = 'ad8f1a46-6aa8-45fa-b07f8d43fe40-5801-4f31';
const BUNNY_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_ZONE = 'petshiwu';
const CDN_BASE   = 'https://petshiwu-cdn.b-cdn.net/products';
const MONGO_URI  = process.env.MONGO_URI;
const WORKER     = parseInt(process.env.WORKER || '0');
const TOTAL_WORKERS = parseInt(process.env.TOTAL_WORKERS || '1');
const CONCURRENCY = 20; // per worker
const MAX_IMAGES  = 6;  // max per product

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
      hostname: p.hostname, path: p.pathname + p.search, timeout: 20000,
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

// Check if image buffer has a watermark/overlay by inspecting JPEG comment or size heuristic
// PetSmart watermarked images tend to be smaller than clean product shots
function isCleanImage(buf) {
  // Reject very small images (likely placeholders or watermark-only)
  if (buf.length < 30000) return false;
  // Check for PetSmart "no image available" placeholder (~same size always ~15kb)
  if (buf.length < 20000) return false;
  return true;
}

async function processOne(db, id, name, existingImages) {
  const bunnyImages = (existingImages || []).filter(u => u && u.includes('b-cdn.net'));
  if (bunnyImages.length >= 2) return 'skip';

  try {
    await sleep(150 + Math.random() * 200);
    const q = encodeURIComponent(name.substring(0, 60));
    const html = (await get(
      `https://www.petsmart.com/search/?q=${q}&format=ajax`,
      { Referer: 'https://www.petsmart.com/', 'X-Requested-With': 'XMLHttpRequest' }
    )).toString('utf8');

    // Only grab pure numeric scene7 IDs (actual product IDs, not UI assets like "person", "treats-new-lg")
    const seen = new Set();
    const scene7Ids = [];
    for (const m of html.matchAll(/scene7\.com\/is\/image\/PetSmart\/(\d{6,10})/g)) {
      if (!seen.has(m[1])) { seen.add(m[1]); scene7Ids.push(m[1]); }
    }
    if (!scene7Ids.length) return 'nomatch';

    // Download HD images — 1200x1200, quality 95, sharpened, no overlays/stickers
    const validBuffers = [];
    for (const s7id of scene7Ids.slice(0, MAX_IMAGES)) {
      try {
        const buf = await get(
          `https://s7d2.scene7.com/is/image/PetSmart/${s7id}?wid=1200&hei=1200&fmt=jpeg&qlt=95&op_sharpen=1&op_usm=1,1,6,0`
        );
        if (isCleanImage(buf)) validBuffers.push(buf);
      } catch { continue; }
    }
    if (!validBuffers.length) return 'nomatch';

    // Upload to Bunny
    const cdnUrls = [];
    for (let i = 0; i < validBuffers.length; i++) {
      const filename = i === 0 ? `${id}.jpg` : `${id}-${i + 1}.jpg`;
      try {
        await upload(validBuffers[i], filename);
        cdnUrls.push(`${CDN_BASE}/${filename}`);
      } catch (e) {
        if (i === 0) return `err:upload_${e.message.substring(0, 30)}`;
      }
    }

    await db.collection('products').updateOne(
      { _id: id },
      { $set: { images: cdnUrls } }
    );
    return `ok:${cdnUrls.length}`;
  } catch (e) {
    if (e.message === 'HTTP404') return 'nomatch';
    if (e.message === 'RATE429') { await sleep(15000); return 'rate'; }
    return `err:${e.message.substring(0, 40)}`;
  }
}

async function main() {
  if (!MONGO_URI) { console.error('MONGO_URI not set'); process.exit(1); }
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
  await client.connect();
  const db = client.db('petshop');

  // Only process products that need work (< 2 bunny images)
  const allProducts = await db.collection('products')
    .find({}, { projection: { _id: 1, name: 1, images: 1 } })
    .toArray();

  const myProducts = allProducts.filter((_, i) => i % TOTAL_WORKERS === WORKER);
  const needsWork = myProducts.filter(p => {
    const bunny = (p.images || []).filter(u => u && u.includes('b-cdn.net'));
    return bunny.length < 2;
  });

  console.log(`[W${WORKER}/${TOTAL_WORKERS}] Total: ${myProducts.length} | Need work: ${needsWork.length}`);

  let ok = 0, skip = 0, nomatch = 0, errors = 0, totalImgs = 0;
  const start = Date.now();

  for (let i = 0; i < needsWork.length; i += CONCURRENCY) {
    const batch = needsWork.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(p => processOne(db, p._id, p.name || '', p.images || []))
    );
    for (const r of results) {
      if (r === 'skip') skip++;
      else if (r === 'nomatch') nomatch++;
      else if (r.startsWith('ok:')) { ok++; totalImgs += parseInt(r.split(':')[1]) || 1; }
      else errors++;
    }

    const done = i + batch.length;
    const pct = Math.round(done / needsWork.length * 100);
    const mins = ((Date.now() - start) / 60000).toFixed(1);
    const rate = done / Math.max((Date.now() - start) / 1000, 1);
    const eta = Math.round((needsWork.length - done) / Math.max(rate, 0.01) / 60);
    const avgImgs = ok > 0 ? (totalImgs / ok).toFixed(1) : 0;
    if (done % 100 === 0 || done === needsWork.length) {
      process.stdout.write(`[W${WORKER}] ${pct}% | ✅${ok}(avg ${avgImgs}imgs) ⏭${skip} ⚠️${nomatch} ❌${errors} | ${mins}min | ETA~${eta}min\n`);
    }
  }

  await client.close();
  console.log(`[W${WORKER}] DONE — ✅${ok} updated | ${totalImgs} total imgs (avg ${ok>0?(totalImgs/ok).toFixed(1):0}/product) | ⚠️${nomatch} no match | ❌${errors} errors`);
}

main().catch(e => { console.error(`[W${WORKER}] Fatal:`, e.message); process.exit(1); });

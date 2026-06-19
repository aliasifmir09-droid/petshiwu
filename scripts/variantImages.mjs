/**
 * variantImages.mjs
 * Scrapes per-variant images for size/weight variants and stores in Bunny CDN.
 * Each variant gets its own image: products/{productId}_v{variantIndex}.jpg
 *
 * Safety rules:
 *   1. Product match — parses "name" JSON from PetSmart AJAX response, verifies
 *      ≥60% token overlap before accepting any image. Skips on no confident match.
 *   2. No footprint — rotating UAs, realistic headers, randomised 1.5–3s delays,
 *      AJAX endpoint (not the SPA search page), numeric scene7 IDs only.
 *   3. High quality — minimum 80KB, scene7 1200×1200 q95 sharp2.
 *
 * Usage: bun scripts/variantImages.mjs [--limit=100] [--offset=0] [--dry-run]
 */

import { MongoClient } from 'mongodb';
import https from 'https';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('MONGO_URI required'); process.exit(1); }

const BUNNY_HOST = 'ny.storage.bunnycdn.com';
const BUNNY_ZONE = 'petshiwu';
const BUNNY_PASS = 'ad8f1a46-6aa8-45fa-b07f8d43fe40-5801-4f31';
const CDN_BASE   = 'https://petshiwu-cdn.b-cdn.net/products';
const SCENE7     = 'https://s7d2.scene7.com/is/image/PetSmart';

const args   = process.argv.slice(2);
const LIMIT  = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]  || '100');
const OFFSET = parseInt(args.find(a => a.startsWith('--offset='))?.split('=')[1] || '0');
const DRY    = args.includes('--dry-run');
const MIN_BYTES = 80_000;

const UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.86 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];
let uaIdx = 0;
const nextUA = () => UAS[(uaIdx++) % UAS.length];
const sleep  = ms => new Promise(r => setTimeout(r, ms));
const jitter = (lo, hi) => sleep(lo + Math.random() * (hi - lo));

// ── HTTP ───────────────────────────────────────────────────────────────────

function get(url, extraHeaders = {}, redirects = 0) {
  if (redirects > 5) return Promise.reject(new Error('too many redirects'));
  return new Promise((resolve, reject) => {
    const p = new URL(url);
    const req = https.get({
      hostname: p.hostname,
      path: p.pathname + p.search,
      timeout: 20000,
      headers: {
        'User-Agent': nextUA(),
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.petsmart.com/',
        ...extraHeaders,
      },
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : `https://${p.hostname}${res.headers.location}`;
        return get(next, extraHeaders, redirects + 1).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ── Bunny upload ───────────────────────────────────────────────────────────

function upload(buf, path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: BUNNY_HOST,
      path: `/${BUNNY_ZONE}/${path}`,
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_PASS,
        'Content-Type': 'image/jpeg',
        'Content-Length': buf.length,
      },
    }, res => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

// ── Product name matching ──────────────────────────────────────────────────

const STOPWORDS = new Set([
  'the','and','for','with','dry','wet','adult','puppy','senior','food','dog','cat','pet',
  'all','life','stages','breed','large','small','medium','formula','recipe','diet',
  'natural','grain','free','flavor','chicken','turkey','salmon','beef','lamb','original',
  'blend','complete','essentials','care','plus','new','in','a','of','to','by',
  'lb','lbs','oz','kg','g','count','pack','ct','bag','can','box','jar','bottle','pouch',
]);

function keyTokens(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function matchScore(ourName, resultName) {
  if (!resultName || resultName.length < 10) return 0;
  const ours   = keyTokens(ourName);
  const theirs = resultName.toLowerCase();
  if (ours.length === 0) return 0;
  const hits = ours.filter(t => theirs.includes(t));
  return hits.length / ours.length;
}

// ── PetSmart AJAX search ───────────────────────────────────────────────────

/**
 * Search PetSmart via AJAX endpoint (returns real HTML with JSON blobs).
 * Extracts "name" JSON fields and pairs them with numeric scene7 IDs.
 * Verifies the top match reaches ≥60% token overlap before returning an image.
 */
async function findVariantImage(productName, brandName) {
  const query = encodeURIComponent(`${brandName} ${productName}`.trim().substring(0, 80));
  const url   = `https://www.petsmart.com/search/?q=${query}&format=ajax`;

  let html;
  try {
    const res = await get(url, { 'X-Requested-With': 'XMLHttpRequest' });
    if (res.status !== 200) return null;
    html = res.body.toString('utf8');
  } catch {
    return null;
  }

  // Extract product "name" JSON values — only those long enough to be real product titles
  const nameMatches = [...html.matchAll(/"name"\s*:\s*"([^"]{20,200})"/g)]
    .map(m => m[1].replace(/\\u0026/g, '&').replace(/\\"/g, '"'));

  // Extract ONLY numeric scene7 IDs (6-10 digits) — eliminates all banners and UI assets
  const seen = new Set();
  const scene7Ids = [];
  for (const m of html.matchAll(/scene7\.com\/is\/image\/PetSmart\/(\d{6,10})/g)) {
    if (!seen.has(m[1])) { seen.add(m[1]); scene7Ids.push(m[1]); }
  }

  if (!scene7Ids.length) return null;

  const fullName = `${brandName} ${productName}`;

  // Find best matching name and its positional index
  let bestScore = 0;
  let bestIdx   = -1;
  for (let i = 0; i < nameMatches.length; i++) {
    const score = matchScore(fullName, nameMatches[i]);
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }

  // Require at least 60% token match
  if (bestScore < 0.60 || bestIdx === -1) return null;

  // Use scene7 ID at same index; fall back to first if index out of range
  const scene7Id = scene7Ids[Math.min(bestIdx, scene7Ids.length - 1)];

  // Fetch high-res image: 1200×1200, q95, sharp, no preset template
  const imgUrl = `${SCENE7}/${scene7Id}?wid=1200&hei=1200&fmt=jpeg&qlt=95&resMode=sharp2&op_usm=1,1,6,0`;
  let imgBuf;
  try {
    const imgRes = await get(imgUrl);
    if (imgRes.status !== 200) return null;
    imgBuf = imgRes.body;
  } catch {
    return null;
  }

  if (imgBuf.length < MIN_BYTES) return null; // too small — placeholder or badge

  return { buffer: imgBuf, scene7Id, matchedName: nameMatches[bestIdx], score: bestScore };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db       = client.db('petshop');
  const products = db.collection('products');

  const allProducts = await products.find({
    isActive: true,
    'variants.1': { $exists: true },
  }).skip(OFFSET).limit(LIMIT * 4).toArray();

  // Only size/weight variant products
  const sizeProducts = allProducts.filter(p =>
    p.variants?.some(v =>
      v.attributes && Object.values(v.attributes).some(val =>
        /\d+\s*(lb|kg|oz|g|ml|l(?:iter)?)/i.test(String(val))
      )
    )
  ).slice(0, LIMIT);

  console.log(`Processing ${sizeProducts.length} products (offset ${OFFSET}, limit ${LIMIT})`);
  if (DRY) console.log('DRY RUN — no uploads or DB writes');

  let updatedVariants = 0, updatedProducts = 0, noMatch = 0, errors = 0;

  for (const product of sizeProducts) {
    const productId = product._id.toString();

    // Decode HTML entities in BOTH name and brand before any comparison.
    // MongoDB stores some brands as "Hill&#039;s Science Diet" (encoded apostrophe)
    // while the product name stores the literal apostrophe — inconsistent encoding.
    const decodeEntities = s => (s || '')
      .replace(/&amp;/g, '&')
      .replace(/&#0*39;/g, "'")   // &#039; or &#39; → apostrophe
      .replace(/&#0*34;/g, '"')   // &#034; or &#34; → quote
      .replace(/&#\d+;/g, '')     // other decimal entities → strip
      .replace(/&apos;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/[^\x20-\x7E]/g, '') // strip remaining non-ASCII
      .trim();

    const rawName = decodeEntities(product.name);
    const brand   = decodeEntities(product.brand);

    // Strip leading brand from product name to avoid "Purina Purina Pro Plan..."
    // Normalize both sides (remove punctuation) for robust comparison
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanName = brand && normalize(rawName).startsWith(normalize(brand))
      ? rawName.slice(brand.length).trim()
      : rawName;

    const variantUpdates = {};
    let productHit = false;

    for (let i = 0; i < product.variants.length; i++) {
      const variant = product.variants[i];
      if (variant.image || variant.images?.length > 0) continue;

      const sizeVal = Object.values(variant.attributes || {}).find(v =>
        /\d+\s*(lb|kg|oz|g|ml|l(?:iter)?)/i.test(String(v))
      );
      if (!sizeVal) continue;

      const bunnyPath = `products/${productId}_v${i}.jpg`;
      const cdnUrl    = `${CDN_BASE}/${productId}_v${i}.jpg`;

      try {
        // All variants of the same product share one search — reuse if productHit
        // but we still need individual images per variant (different size = sometimes different photo)
        const result = await findVariantImage(cleanName, brand);

        if (!result) {
          noMatch++;
          console.log(`  ✗ NO MATCH  [${Math.round(0)}%] ${rawName.substring(0, 50)} | ${sizeVal}`);
        } else {
          if (!DRY) {
            const status = await upload(result.buffer, bunnyPath);
            if (status !== 201) {
              console.log(`  ✗ UPLOAD ${status}  ${rawName.substring(0, 50)} | ${sizeVal}`);
              errors++;
              await jitter(1000, 2000);
              continue;
            }
            variantUpdates[`variants.${i}.image`] = cdnUrl;
          }
          console.log(`  ✓ [${Math.round(result.score * 100)}%] ${rawName.substring(0, 45)} | ${sizeVal} | ${(result.buffer.length / 1024).toFixed(0)}KB | scene7:${result.scene7Id}`);
          updatedVariants++;
          productHit = true;
        }

        await jitter(1500, 3000); // randomised delay between each request
      } catch (err) {
        console.log(`  ✗ ERR  ${rawName.substring(0, 50)} | ${sizeVal}: ${err.message}`);
        errors++;
        await jitter(2000, 4000);
      }
    }

    if (!DRY && Object.keys(variantUpdates).length > 0) {
      await products.updateOne({ _id: product._id }, { $set: variantUpdates });
      updatedProducts++;
    }
  }

  console.log(`\nDone. Variants updated: ${updatedVariants} | Products saved: ${updatedProducts} | No match: ${noMatch} | Errors: ${errors}`);
  await client.close();
}

main().catch(console.error);

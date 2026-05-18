/**
 * enrichVariants.mjs
 * Enriches petshiwu products with full size/flavor/price variants from PetSmart.
 * 
 * Strategy:
 *  1. Find products with only 1 variant (9,993 of them)
 *  2. Extract the scene7 SKU from the product's image URL
 *  3. Search PetSmart for that SKU → get the parent product URL
 *  4. Fetch the parent page → parse variantToSkuMap + prices
 *  5. Update the product in MongoDB with all variants
 * 
 * Run: MONGODB_URI=... bun run enrichVariants.mjs
 * Resume: Script skips products with petsmartSynced=true
 * Dry run: DRY_RUN=true bun run enrichVariants.mjs
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '4');
const DRY_RUN = process.env.DRY_RUN === 'true';
const LIMIT = parseInt(process.env.LIMIT || '0'); // 0 = all
const DELAY_MS = 800; // ms between requests per worker

if (!MONGODB_URI) { console.error('Missing MONGODB_URI'); process.exit(1); }

// ─────────── Helpers ───────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractSkuFromImageUrl(images = []) {
  for (const img of images) {
    const m = img.match(/PetSmart(?:%2F|\/)(\d{5,})/);
    if (m) return m[1];
  }
  return null;
}

async function fetchHtml(url, retries = 3) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
  };
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const resp = await fetch(url, { headers });
      if (resp.status === 429) {
        console.log(`  [rate limit] waiting 5s...`);
        await sleep(5000);
        continue;
      }
      if (!resp.ok) return null;
      return await resp.text();
    } catch (e) {
      if (attempt === retries - 1) return null;
      await sleep(2000 * (attempt + 1));
    }
  }
  return null;
}

/** Search PetSmart for SKU, return the first product URL path */
async function findParentUrl(sku) {
  const html = await fetchHtml(`https://www.petsmart.com/search?q=${sku}`);
  if (!html) return null;

  // Extract product links — look for numeric ID at end (e.g. -570.html)
  // The first match should be the parent product URL
  const patterns = [
    /href="(\/[a-z][^"]+?-(\d{3,6})\.html)"/g,
    /href="(\/[a-z][^"]+?-(\d{3,6})\/)"/g,
  ];
  
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(html)) !== null) {
      const id = parseInt(m[2]);
      // Parent IDs are typically < 100000 (short), variant SKUs are 7 digits
      if (id < 100000) return m[1];
    }
  }
  return null;
}

/** Parse variant map and prices from a PetSmart product page */
function parseProductPage(html) {
  // ── variantToSkuMap (double-escaped in page) ──
  const vmIdx = html.indexOf('variantToSkuMap');
  if (vmIdx === -1) return null;
  
  const chunk = html.slice(vmIdx, vmIdx + 1200);
  const unescaped = chunk.replace(/\\"/g, '"');
  const mapMatch = unescaped.match(/variantToSkuMap"\s*:\s*(\{[^}]+\})/);
  if (!mapMatch) return null;
  
  let variantMap;
  try {
    // JSON.parse handles \uXXXX escapes natively
    variantMap = JSON.parse(mapMatch[1]);
  } catch {
    // Fallback: manual unicode decode then parse
    try {
      const jsonStr = mapMatch[1].replace(/\\u([\da-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
      variantMap = JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }

  // ── Prices from JSON-LD ──
  const skuPrices = {};
  const ldRegex = /<script[^>]+ld\+json[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = ldRegex.exec(html)) !== null) {
    try {
      const d = JSON.parse(m[1].trim());
      if (d['@type'] === 'Product' && d.sku && d.offers?.price) {
        skuPrices[d.sku] = parseFloat(d.offers.price);
      }
    } catch {}
  }

  return { variantMap, skuPrices };
}

/** Build variant objects from PetSmart data */
function buildVariants(variantMap, skuPrices) {
  const variants = [];
  for (const [combo, psSku] of Object.entries(variantMap)) {
    const parts = {};
    for (const part of combo.split(';')) {
      const ci = part.indexOf(':');
      if (ci !== -1) parts[part.slice(0, ci).trim()] = part.slice(ci + 1).trim();
    }
    const flavor = parts.flavor || '';
    const size = parts.size || parts.weight || '';
    const price = skuPrices[psSku] || 0;

    // Attribute format matching existing DB convention: "flavor: X" -> "Y Lb"
    const attrKey = flavor ? `flavor: ${flavor}` : 'size';
    const attrVal = size || flavor;

    // Generate a stable internal SKU
    const skuStr = `ps-${psSku}`;

    variants.push({
      attributes: { [attrKey]: attrVal },
      price,
      stock: 30,
      sku: skuStr,
      images: [],
      psItemId: psSku,  // store PetSmart item ID for future image migration
    });
  }
  // Sort by price ascending
  variants.sort((a, b) => a.price - b.price);
  return variants;
}

// ─────────── Main ───────────────────────────────────────────────

async function processProduct(col, product) {
  const sku = extractSkuFromImageUrl(product.images || []);
  if (!sku) return { status: 'skip', reason: 'no_sku' };

  await sleep(DELAY_MS);

  // Step 1: find parent URL from search
  const parentPath = await findParentUrl(sku);
  if (!parentPath) return { status: 'skip', reason: 'no_search_result' };

  await sleep(DELAY_MS);

  // Step 2: fetch parent page
  const html = await fetchHtml(`https://www.petsmart.com${parentPath}`);
  if (!html) return { status: 'skip', reason: 'fetch_failed' };

  // Step 3: parse
  const parsed = parseProductPage(html);
  if (!parsed) return { status: 'skip', reason: 'parse_failed' };

  const { variantMap, skuPrices } = parsed;
  const variantCount = Object.keys(variantMap).length;
  
  // If PetSmart only has 1 variant too, mark synced but don't change variants
  if (variantCount <= 1) {
    if (!DRY_RUN) {
      await col.updateOne({ _id: product._id }, { $set: { petsmartSynced: true } });
    }
    return { status: 'single', variants: 1 };
  }

  const newVariants = buildVariants(variantMap, skuPrices);
  const lowestPrice = newVariants[0]?.price || product.price;

  if (!DRY_RUN) {
    await col.updateOne(
      { _id: product._id },
      {
        $set: {
          variants: newVariants,
          price: lowestPrice,
          petsmartSynced: true,
        }
      }
    );
  }

  return { status: 'enriched', variants: newVariants.length };
}

async function main() {
  console.log(`\n🐾 Variant Enrichment Script`);
  console.log(`   Concurrency: ${CONCURRENCY} | DryRun: ${DRY_RUN} | Limit: ${LIMIT || 'all'}\n`);

  await mongoose.connect(MONGODB_URI, { dbName: 'petshop' });
  const col = mongoose.connection.db.collection('products');

  // Find products needing enrichment (1 variant, not yet synced)
  const query = {
    petsmartSynced: { $ne: true },
    $expr: { $lte: [{ $size: { $ifNull: ['$variants', []] } }, 1] }
  };
  const total = await col.countDocuments(query);
  const toProcess = LIMIT ? Math.min(total, LIMIT) : total;
  console.log(`Found ${total} products to enrich. Processing ${toProcess}...\n`);

  const cursor = col.find(query, { projection: { _id: 1, name: 1, images: 1, price: 1 } }).limit(toProcess);

  // Stats
  let done = 0, enriched = 0, singles = 0, skipped = 0, errors = 0;
  const startTime = Date.now();

  // Worker pool
  const queue = [];
  let product;
  while ((product = await cursor.next()) !== null) {
    queue.push(product);
  }

  async function worker(id) {
    while (queue.length > 0) {
      const p = queue.shift();
      if (!p) break;
      try {
        const result = await processProduct(col, p);
          done++;
          if (result.status === 'enriched') {
            enriched++;
            console.log(`  ✓ ${p.name?.slice(0, 50)} — ${result.variants} variants`);
          } else if (result.status === 'single') {
            singles++;
          } else {
            skipped++;
            if (LIMIT <= 20) console.log(`  ↷ skip(${result.reason}): ${p.name?.slice(0, 45)}`);
          }

          if (done % 10 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = done / elapsed;
            const remaining = (toProcess - done) / rate;
            const pct = ((done / toProcess) * 100).toFixed(1);
            console.log(`[${pct}%] ${done}/${toProcess} done — enriched:${enriched} single:${singles} skip:${skipped} — ~${Math.round(remaining)}s left`);
          }
      } catch (e) {
        errors++;
        done++;
        console.error(`  ✗ ${p.name?.slice(0, 50)}: ${e.message}`);
      }
    }
  }

  // Run workers in parallel
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n✅ Done in ${elapsed}s`);
  console.log(`   Enriched: ${enriched} | Single-variant (no more): ${singles} | Skipped: ${skipped} | Errors: ${errors}`);

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

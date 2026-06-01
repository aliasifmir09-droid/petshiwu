/**
 * addFoodVariants.mjs
 * Scans all food products with 1 variant and adds missing sizes/prices
 * matching PetSmart's current catalog.
 */

import https from 'https';

const API_BASE = 'https://petshiwu.onrender.com/api/v1';
let TOKEN = '';

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ raw: d }); } });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login() {
  const res = await apiRequest('POST', '/auth/login', {
    email: 'admin@petshiwu.com', password: '@Admin,1+23as',
  });
  TOKEN = res.token || res.data?.token;
  if (!TOKEN) throw new Error('Login failed');
  console.log('✅ Logged in');
}

// ---------------------------------------------------------------------------
// PetSmart size+price catalog — confirmed from PetSmart search results
// Each entry: regex to match product name → array of all sizes PetSmart carries
// ---------------------------------------------------------------------------
const CATALOG = [
  // ── BLUE BUFFALO ──────────────────────────────────────────────────────────
  {
    match: /blue buffalo tastefuls.*hairball.*adult cat/i,
    sizes: [
      { size: '7 lb',  price: 24.99, stock: 40 },
      { size: '15 lb', price: 46.99, stock: 40 },
    ],
  },
  {
    match: /blue buffalo tastefuls.*indoor.*adult cat/i,
    sizes: [
      { size: '7 lb',  price: 22.99, stock: 40 },
      { size: '15 lb', price: 44.99, stock: 40 },
    ],
  },
  {
    match: /blue buffalo tastefuls.*adult cat.*7\+/i,
    sizes: [{ size: '7 lb', price: 31.99, stock: 40 }],
  },
  {
    match: /blue buffalo wilderness.*indoor.*adult.*dry cat/i,
    sizes: [
      { size: '5 lb',  price: 22.99, stock: 40 },
      { size: '11 lb', price: 40.99, stock: 40 },
    ],
  },
  {
    match: /blue buffalo true solutions.*blissful belly/i,
    sizes: [
      { size: '4.5 lb', price: 20.99, stock: 40 },
      { size: '11 lb',  price: 40.99, stock: 40 },
    ],
  },
  {
    match: /blue buffalo tastefuls.*adult cat hairball/i,
    sizes: [
      { size: '7 lb',  price: 24.99, stock: 40 },
      { size: '15 lb', price: 46.99, stock: 40 },
    ],
  },
  // ── WELLNESS CORE ─────────────────────────────────────────────────────────
  {
    match: /wellness.*core.*indoor.*adult cat/i,
    sizes: [
      { size: '5 lb',  price: 24.69, stock: 40 },
      { size: '11 lb', price: 44.99, stock: 40 },
    ],
  },
  {
    match: /wellness.*core\+.*healthy weight.*adult cat/i,
    sizes: [
      { size: '4.75 lb', price: 24.69, stock: 40 },
      { size: '10 lb',   price: 44.99, stock: 40 },
    ],
  },
  {
    match: /wellness.*core.*adult cat.*grain free/i,
    sizes: [
      { size: '5 lb',  price: 24.69, stock: 40 },
      { size: '11 lb', price: 44.99, stock: 40 },
    ],
  },
  // ── ROYAL CANIN ───────────────────────────────────────────────────────────
  {
    match: /royal canin.*hairball care.*3lb/i,
    sizes: [
      { size: '3 lb',  price: 28.99, stock: 40 },
      { size: '7 lb',  price: 45.99, stock: 40 },
      { size: '14 lb', price: 72.99, stock: 40 },
    ],
  },
  {
    match: /royal canin feline indoor.*adult/i,
    sizes: [
      { size: '3 lb',  price: 23.99, stock: 40 },
      { size: '7 lb',  price: 42.99, stock: 40 },
      { size: '14 lb', price: 72.99, stock: 40 },
    ],
  },
  {
    match: /royal canin feline adult dry cat/i,
    sizes: [
      { size: '3 lb',  price: 23.99, stock: 40 },
      { size: '7 lb',  price: 42.99, stock: 40 },
      { size: '14 lb', price: 72.99, stock: 40 },
    ],
  },
  {
    match: /royal canin.*indoor 7\+.*mature/i,
    sizes: [
      { size: '3 lb', price: 23.99, stock: 40 },
      { size: '7 lb', price: 42.99, stock: 40 },
    ],
  },
  // ── NULO ──────────────────────────────────────────────────────────────────
  {
    match: /nulo medalseries.*healthy weight.*adult.*dry cat/i,
    sizes: [
      { size: '5 lb',  price: 25.99, stock: 40 },
      { size: '12 lb', price: 49.99, stock: 40 },
    ],
  },
  {
    match: /nulo prowess.*sensitive stomach.*adult cat/i,
    sizes: [
      { size: '5 lb',  price: 17.99, stock: 40 },
      { size: '12 lb', price: 34.99, stock: 40 },
    ],
  },
  {
    match: /nulo raw medley.*adult cat/i,
    sizes: [
      { size: '5 lb',  price: 26.99, stock: 40 },
      { size: '12 lb', price: 49.99, stock: 40 },
    ],
  },
  {
    match: /nulo prowess.*kitten/i,
    sizes: [
      { size: '5 lb',  price: 17.99, stock: 40 },
      { size: '12 lb', price: 34.99, stock: 40 },
    ],
  },
  {
    match: /nulo medalseries.*adult dry cat/i,
    sizes: [
      { size: '5 lb',  price: 23.99, stock: 40 },
      { size: '12 lb', price: 44.99, stock: 40 },
    ],
  },
  // ── INSTINCT ──────────────────────────────────────────────────────────────
  {
    match: /instinct.*limited ingredient.*adult cat/i,
    sizes: [
      { size: '4.5 lb', price: 31.99, stock: 40 },
      { size: '10 lb',  price: 54.99, stock: 40 },
    ],
  },
  // ── AUTHORITY ─────────────────────────────────────────────────────────────
  {
    match: /authority.*everyday health.*indoor.*senior.*cat/i,
    sizes: [
      { size: '6 lb',  price: 17.99, stock: 40 },
      { size: '14 lb', price: 27.99, stock: 40 },
    ],
  },
  {
    match: /authority.*sensitive stomach.*skin.*cat dry food/i,
    sizes: [
      { size: '6 lb',  price: 17.99, stock: 40 },
      { size: '14 lb', price: 28.99, stock: 40 },
    ],
  },
  {
    match: /authority.*everyday health.*all life stages.*dry cat/i,
    sizes: [
      { size: '6 lb',  price: 15.99, stock: 40 },
      { size: '14 lb', price: 27.99, stock: 40 },
    ],
  },
  // ── PURINA ONE ────────────────────────────────────────────────────────────
  {
    match: /purina one.*tender selects.*adult.*dry cat/i,
    sizes: [
      { size: '3.5 lb', price: 11.99, stock: 40 },
      { size: '7 lb',   price: 19.99, stock: 40 },
      { size: '22 lb',  price: 41.99, stock: 40 },
    ],
  },
  // ── IAMS ──────────────────────────────────────────────────────────────────
  {
    match: /iams.*proactive health.*indoor.*weight.*hairball/i,
    sizes: [
      { size: '3.5 lb', price: 10.99, stock: 40 },
      { size: '7 lb',   price: 17.99, stock: 40 },
      { size: '16 lb',  price: 32.99, stock: 40 },
    ],
  },
  {
    match: /iams.*proactive health.*indoor.*adult.*dry cat/i,
    sizes: [
      { size: '3.5 lb', price: 10.99, stock: 40 },
      { size: '7 lb',   price: 18.98, stock: 40 },
      { size: '16 lb',  price: 33.99, stock: 40 },
    ],
  },
  {
    match: /iams.*proactive health.*adult.*dry cat/i,
    sizes: [
      { size: '3.5 lb', price: 10.99, stock: 40 },
      { size: '7 lb',   price: 17.99, stock: 40 },
      { size: '16 lb',  price: 32.99, stock: 40 },
    ],
  },
  // ── HILL'S SCIENCE DIET ───────────────────────────────────────────────────
  {
    match: /hill.*science diet.*adult.*dry cat.*salmon/i,
    sizes: [
      { size: '3.5 lb', price: 23.99, stock: 40 },
      { size: '7 lb',   price: 38.99, stock: 40 },
      { size: '16 lb',  price: 62.99, stock: 40 },
    ],
  },
  {
    match: /hill.*science diet.*adult.*dry cat/i,
    sizes: [
      { size: '3.5 lb', price: 22.99, stock: 40 },
      { size: '7 lb',   price: 36.99, stock: 40 },
      { size: '16 lb',  price: 59.99, stock: 40 },
    ],
  },
  // ── MEOW MIX ──────────────────────────────────────────────────────────────
  {
    match: /meow mix.*tender centers/i,
    sizes: [
      { size: '3 lb',   price: 7.99,  stock: 40 },
      { size: '6.3 lb', price: 12.99, stock: 40 },
    ],
  },
  {
    match: /meow mix.*gravy bursts/i,
    sizes: [
      { size: '3 lb',   price: 7.99,  stock: 40 },
      { size: '6.3 lb', price: 12.99, stock: 40 },
    ],
  },
  // ── TIKI CAT ──────────────────────────────────────────────────────────────
  {
    match: /tiki cat.*born carnivore.*high protein.*dry/i,
    sizes: [
      { size: '5.6 lb', price: 25.99, stock: 40 },
      { size: '11.1 lb', price: 39.89, stock: 40 },
    ],
  },
  // ── TEMPTATIONS ───────────────────────────────────────────────────────────
  {
    match: /temptations.*adult.*complete nutrition.*dry cat/i,
    sizes: [
      { size: '3.08 lb', price: 5.99,  stock: 40 },
      { size: '6.3 lb',  price: 10.99, stock: 40 },
    ],
  },
  // ── NUTRO ─────────────────────────────────────────────────────────────────
  {
    match: /nutro wholesome essentials.*indoor.*adult.*dry cat/i,
    sizes: [
      { size: '3 lb',   price: 13.99, stock: 40 },
      { size: '5 lb',   price: 19.99, stock: 40 },
      { size: '14 lb',  price: 44.99, stock: 40 },
    ],
  },
  // ── REVEAL ────────────────────────────────────────────────────────────────
  {
    match: /reveal.*adult.*complete.*cat food.*grain free/i,
    sizes: [
      { size: '5.5 lb',  price: 14.99, stock: 40 },
      { size: '10 lb',   price: 22.99, stock: 40 },
    ],
  },
  {
    match: /reveal.*kitten.*grain free/i,
    sizes: [
      { size: '5.5 lb', price: 14.99, stock: 40 },
    ],
  },
  // ── CRAVE ─────────────────────────────────────────────────────────────────
  {
    match: /crave.*high protein.*adult.*dry cat/i,
    sizes: [
      { size: '4 lb',  price: 13.99, stock: 40 },
      { size: '10 lb', price: 26.99, stock: 40 },
    ],
  },
  // ── CAT CHOW ──────────────────────────────────────────────────────────────
  {
    match: /purina.*cat chow.*senior.*dry food/i,
    sizes: [
      { size: '3.15 lb', price: 6.29,  stock: 40 },
      { size: '7 lb',    price: 11.99, stock: 40 },
    ],
  },
  // ── DOG FOOD ──────────────────────────────────────────────────────────────
  {
    match: /purina pro plan.*adult.*dry dog.*chicken.*rice/i,
    sizes: [
      { size: '6 lb',  price: 16.58, stock: 40 },
      { size: '18 lb', price: 47.99, stock: 40 },
      { size: '35 lb', price: 74.49, stock: 40 },
      { size: '47 lb', price: 96.49, stock: 40 },
    ],
  },
  {
    match: /purina pro plan.*sensitive.*salmon.*adult.*dry dog/i,
    sizes: [
      { size: '6 lb',  price: 20.68, stock: 40 },
      { size: '16 lb', price: 50.49, stock: 40 },
      { size: '30 lb', price: 77.49, stock: 40 },
      { size: '41 lb', price: 94.99, stock: 40 },
    ],
  },
  {
    match: /purina pro plan.*large breed.*adult.*dry dog.*chicken/i,
    sizes: [
      { size: '18 lb', price: 54.49, stock: 40 },
      { size: '34 lb', price: 77.49, stock: 40 },
      { size: '47 lb', price: 97.99, stock: 40 },
    ],
  },
  {
    match: /hill.*science diet.*sensitive stomach.*adult.*dry dog/i,
    sizes: [
      { size: '4 lb',   price: 23.99,  stock: 40 },
      { size: '15.5 lb', price: 59.99, stock: 40 },
      { size: '30 lb',  price: 104.99, stock: 40 },
    ],
  },
  {
    match: /wellness core.*large breed.*puppy.*dry/i,
    sizes: [
      { size: '4 lb',   price: 25.99, stock: 40 },
      { size: '12.5 lb', price: 59.99, stock: 40 },
      { size: '24 lb',  price: 77.99, stock: 40 },
    ],
  },
];

function findSizes(productName) {
  for (const entry of CATALOG) {
    if (entry.match.test(productName)) {
      return entry.sizes;
    }
  }
  return null;
}

async function updateVariants(productId, currentVariants, newSizes) {
  const existingPrices = new Set(currentVariants.map(v => String(v.price)));
  const toAdd = newSizes.filter(s => !existingPrices.has(String(s.price)));
  // If nothing to add AND existing already have size labels, skip
  const existingNeedLabels = currentVariants.some(v => !v.size);
  if (toAdd.length === 0 && !existingNeedLabels) return { skipped: true };

  // Strip _id + fix blank size labels on existing variants by matching to catalog price
  const priceToSize = Object.fromEntries(newSizes.map(s => [String(s.price), s.size]));
  const cleanExisting = currentVariants.map(({ _id, ...v }) => {
    const clean = { ...v, attributes: {} };
    if (!clean.size && priceToSize[String(v.price)]) {
      clean.size = priceToSize[String(v.price)];
      clean.attributes = { size: clean.size };
    }
    return clean;
  });

  const allVariants = [
    ...cleanExisting,
    ...toAdd.map((s, i) => ({
      size: s.size,
      price: s.price,
      stock: s.stock,
      sku: `${productId}-sz${cleanExisting.length + i + 1}`,
      attributes: { size: s.size },
    })),
  ];

  const res = await apiRequest('PUT', `/products/${productId}`, {
    variants: allVariants,
    basePrice: Math.min(...allVariants.map(v => v.price)),
    totalStock: allVariants.reduce((a, v) => a + (v.stock || 0), 0),
  });

  if (res.success || res.data) return { added: toAdd.length, total: allVariants.length };
  return { error: JSON.stringify(res).slice(0, 100) };
}

const FOOD_CATS = [
  'dry food', 'wet food', 'canned food', 'puppy food', 'kitten food',
  'food toppers', 'freeze dried', 'jerky treats', 'dental treats',
  'biscuits', 'food & treats', 'puppy treats', 'bones, bully',
];

async function main() {
  await login();

  let checked = 0, matched = 0, updated = 0, errors = 0;
  const results = [];

  for (let page = 1; page <= 102; page++) {
    const res = await apiRequest('GET', `/products?limit=100&page=${page}`);
    const products = res.data || [];
    if (!products.length) break;

    for (const p of products) {
      const catName = (typeof p.category === 'object' ? p.category?.name : '') || '';
      if (!FOOD_CATS.some(f => catName.toLowerCase().includes(f))) continue;
      if ((p.variants || []).length > 1) continue; // already has multiple sizes

      checked++;
      const sizes = findSizes(p.name);
      if (!sizes) continue;

      matched++;
      console.log(`\n[${matched}] ${p.name.substring(0, 65)}`);
      console.log(`  Sizes: ${sizes.map(s => `${s.size}=$${s.price}`).join(', ')}`);

      try {
        const result = await updateVariants(p._id, p.variants || [], sizes);
        if (result.skipped) {
          console.log('  ⏭  All sizes already present');
        } else if (result.added) {
          updated++;
          console.log(`  ✅ Added ${result.added} size(s) (total: ${result.total})`);
          results.push({ name: p.name, added: result.added });
        } else {
          errors++;
          console.log(`  ❌ ${result.error}`);
        }
      } catch (e) {
        errors++;
        console.log(`  ❌ ${e.message}`);
      }

      await new Promise(r => setTimeout(r, 300));
    }

    if (page % 5 === 0) console.log(`\n--- Page ${page}: checked ${checked} food, matched ${matched}, updated ${updated} ---`);
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`DONE — Scanned: ${checked} food products with 1 variant`);
  console.log(`       Matched in catalog: ${matched}`);
  console.log(`       Updated: ${updated}`);
  console.log(`       Errors: ${errors}`);
}

main().catch(console.error);

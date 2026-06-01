/**
 * addFoodVariants2.mjs — Round 2
 * Covers all remaining single-variant food products with PetSmart sizes/prices
 */
import https from 'https';

const API_BASE = 'https://petshiwu.onrender.com/api/v1';
let TOKEN = '';

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const opts = {
      hostname: url.hostname, path: url.pathname + url.search, method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json',
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
    };
    const req = https.request(opts, res => {
      let d = ''; res.on('data', c => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ raw: d }); } });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login() {
  const res = await apiRequest('POST', '/auth/login', { email: 'admin@petshiwu.com', password: '@Admin,1+23as' });
  TOKEN = res.token || res.data?.token;
  if (!TOKEN) throw new Error('Login failed');
  console.log('✅ Logged in');
}

// ─── COMPREHENSIVE CATALOG ────────────────────────────────────────────────────
// Tuned from PetSmart listings. Patterns are intentionally broad to catch variants.
const CATALOG = [
  // ── PURINA PRO PLAN CAT ───────────────────────────────────────────────────
  { match: /purina pro plan.*kitten.*dry cat/i,
    sizes: [{ size: '3.5 lb', price: 14.99, stock: 40 }, { size: '7 lb', price: 28.09, stock: 40 }] },
  { match: /purina pro plan.*vital systems.*senior.*cat/i,
    sizes: [{ size: '5.5 lb', price: 26.48, stock: 40 }, { size: '11 lb', price: 44.99, stock: 40 }] },
  { match: /purina pro plan.*vital systems.*adult.*cat/i,
    sizes: [{ size: '5.5 lb', price: 26.48, stock: 40 }, { size: '11 lb', price: 44.99, stock: 40 }] },
  { match: /purina pro plan.*complete essentials.*kitten/i,
    sizes: [{ size: '3.5 lb', price: 14.99, stock: 40 }, { size: '7 lb', price: 28.09, stock: 40 }] },
  { match: /purina pro plan.*sensitive.*skin.*adult cat/i,
    sizes: [{ size: '3.5 lb', price: 14.49, stock: 40 }, { size: '7 lb', price: 24.49, stock: 40 }, { size: '16 lb', price: 49.99, stock: 40 }] },
  { match: /purina pro plan.*complete essentials.*adult cat/i,
    sizes: [{ size: '3.5 lb', price: 13.99, stock: 40 }, { size: '7 lb', price: 24.49, stock: 40 }, { size: '16 lb', price: 49.99, stock: 40 }] },
  { match: /purina pro plan.*indoor care.*adult cat/i,
    sizes: [{ size: '3.5 lb', price: 13.99, stock: 40 }, { size: '7 lb', price: 24.49, stock: 40 }] },
  { match: /purina pro plan.*hairball.*adult cat/i,
    sizes: [{ size: '3.5 lb', price: 13.99, stock: 40 }, { size: '7 lb', price: 24.49, stock: 40 }, { size: '16 lb', price: 49.99, stock: 40 }] },
  // ── PURINA ONE CAT ────────────────────────────────────────────────────────
  { match: /purina one.*liveclear.*allergen.*adult.*cat/i,
    sizes: [{ size: '3.2 lb', price: 12.99, stock: 40 }, { size: '7 lb', price: 18.99, stock: 40 }, { size: '15.1 lb', price: 34.99, stock: 40 }] },
  { match: /purina one.*indoor advantage.*adult cat/i,
    sizes: [{ size: '3.5 lb', price: 10.29, stock: 40 }, { size: '7 lb', price: 17.99, stock: 40 }, { size: '22 lb', price: 38.99, stock: 40 }] },
  { match: /purina one.*tender selects.*adult cat/i,
    sizes: [{ size: '3.5 lb', price: 11.99, stock: 40 }, { size: '7 lb', price: 19.99, stock: 40 }, { size: '22 lb', price: 41.99, stock: 40 }] },
  // ── PURINA BEYOND CAT ─────────────────────────────────────────────────────
  { match: /purina.*beyond.*simply.*indoor.*adult cat/i,
    sizes: [{ size: '5 lb', price: 13.99, stock: 40 }, { size: '11 lb', price: 22.48, stock: 40 }] },
  { match: /purina.*beyond.*simply.*adult cat/i,
    sizes: [{ size: '5 lb', price: 13.99, stock: 40 }, { size: '11 lb', price: 21.48, stock: 40 }] },
  // ── NUTRO CAT ─────────────────────────────────────────────────────────────
  { match: /nutro wholesome essentials.*kitten.*cat/i,
    sizes: [{ size: '3 lb', price: 12.99, stock: 40 }, { size: '5 lb', price: 22.99, stock: 40 }] },
  { match: /nutro wholesome essentials.*senior.*cat/i,
    sizes: [{ size: '3 lb', price: 13.99, stock: 40 }, { size: '5 lb', price: 22.99, stock: 40 }] },
  { match: /nutro wholesome essentials.*sensitive.*adult.*cat/i,
    sizes: [{ size: '3 lb', price: 13.99, stock: 40 }, { size: '5 lb', price: 22.99, stock: 40 }] },
  { match: /nutro wholesome essentials.*adult.*cat/i,
    sizes: [{ size: '3 lb', price: 13.99, stock: 40 }, { size: '5 lb', price: 19.99, stock: 40 }, { size: '14 lb', price: 44.99, stock: 40 }] },
  // ── SIMPLY NOURISH CAT ────────────────────────────────────────────────────
  { match: /simply nourish.*original.*senior.*cat/i,
    sizes: [{ size: '3.5 lb', price: 14.99, stock: 40 }, { size: '7 lb', price: 26.99, stock: 40 }] },
  { match: /simply nourish.*original.*weight management.*cat/i,
    sizes: [{ size: '3.5 lb', price: 14.99, stock: 40 }, { size: '7 lb', price: 26.99, stock: 40 }] },
  { match: /simply nourish.*original.*cat dry food/i,
    sizes: [{ size: '3.5 lb', price: 14.99, stock: 40 }, { size: '7 lb', price: 26.99, stock: 40 }] },
  // ── MERRICK CAT ───────────────────────────────────────────────────────────
  { match: /merrick.*purrfect bistro.*kitten.*cat/i,
    sizes: [{ size: '4 lb', price: 19.99, stock: 40 }, { size: '12 lb', price: 44.99, stock: 40 }] },
  { match: /merrick.*purrfect bistro.*adult.*cat.*chicken/i,
    sizes: [{ size: '7 lb', price: 31.99, stock: 40 }, { size: '14 lb', price: 45.99, stock: 40 }, { size: '22 lb', price: 59.99, stock: 40 }] },
  { match: /merrick.*purrfect bistro.*adult.*cat.*salmon/i,
    sizes: [{ size: '7 lb', price: 31.99, stock: 40 }, { size: '14 lb', price: 43.99, stock: 40 }, { size: '22 lb', price: 59.99, stock: 40 }] },
  { match: /merrick.*purrfect bistro.*adult.*cat/i,
    sizes: [{ size: '7 lb', price: 31.99, stock: 40 }, { size: '14 lb', price: 45.99, stock: 40 }] },
  // ── ROYAL CANIN BREED CAT ─────────────────────────────────────────────────
  { match: /royal canin.*persian.*adult.*cat/i,
    sizes: [{ size: '7 lb', price: 45.99, stock: 40 }, { size: '14 lb', price: 72.99, stock: 40 }] },
  { match: /royal canin.*bengal.*adult.*cat/i,
    sizes: [{ size: '7 lb', price: 45.99, stock: 40 }, { size: '14 lb', price: 72.99, stock: 40 }] },
  { match: /royal canin.*siamese.*adult.*cat/i,
    sizes: [{ size: '6 lb', price: 42.99, stock: 40 }, { size: '10 lb', price: 62.99, stock: 40 }] },
  { match: /royal canin.*maine coon.*adult.*cat/i,
    sizes: [{ size: '6 lb', price: 42.99, stock: 40 }, { size: '10 lb', price: 62.99, stock: 40 }] },
  { match: /royal canin.*ragdoll.*adult.*cat/i,
    sizes: [{ size: '6 lb', price: 42.99, stock: 40 }, { size: '10 lb', price: 62.99, stock: 40 }] },
  { match: /royal canin.*british shorthair.*adult.*cat/i,
    sizes: [{ size: '6 lb', price: 42.99, stock: 40 }, { size: '10 lb', price: 62.99, stock: 40 }] },
  { match: /royal canin.*spayed.*neutered.*cat/i,
    sizes: [{ size: '3.5 lb', price: 22.99, stock: 40 }, { size: '7.7 lb', price: 42.99, stock: 40 }] },
  { match: /royal canin.*kitten.*dry cat/i,
    sizes: [{ size: '3.5 lb', price: 22.99, stock: 40 }, { size: '7 lb', price: 37.99, stock: 40 }] },
  { match: /royal canin.*feline care.*hairball.*adult.*cat/i,
    sizes: [{ size: '3.5 lb', price: 22.99, stock: 40 }, { size: '7.7 lb', price: 42.99, stock: 40 }, { size: '17.6 lb', price: 72.99, stock: 40 }] },
  { match: /royal canin.*feline.*adult.*cat/i,
    sizes: [{ size: '3.5 lb', price: 22.99, stock: 40 }, { size: '7.7 lb', price: 42.99, stock: 40 }] },
  // ── BLUE BUFFALO CAT ──────────────────────────────────────────────────────
  { match: /blue buffalo.*life protection.*adult.*cat/i,
    sizes: [{ size: '5 lb', price: 16.99, stock: 40 }, { size: '15 lb', price: 39.99, stock: 40 }] },
  { match: /blue buffalo.*tastefuls.*senior.*cat.*7\+/i,
    sizes: [{ size: '7 lb', price: 27.99, stock: 40 }, { size: '15 lb', price: 44.99, stock: 40 }] },
  { match: /blue buffalo.*tastefuls.*natural.*sensitive.*cat/i,
    sizes: [{ size: '7 lb', price: 24.99, stock: 40 }, { size: '15 lb', price: 44.99, stock: 40 }] },
  { match: /blue buffalo.*tastefuls.*kitten.*cat/i,
    sizes: [{ size: '5 lb', price: 16.99, stock: 40 }, { size: '15 lb', price: 39.99, stock: 40 }] },
  // ── HILL'S SCIENCE DIET CAT REMAINING ─────────────────────────────────────
  { match: /hill.*science diet.*kitten.*ocean fish/i,
    sizes: [{ size: '3.5 lb', price: 21.99, stock: 40 }, { size: '7 lb', price: 36.99, stock: 40 }] },
  { match: /hill.*science diet.*senior 11\+.*cat/i,
    sizes: [{ size: '2.5 lb', price: 18.99, stock: 40 }, { size: '7 lb', price: 34.99, stock: 40 }] },
  { match: /hill.*science diet.*kitten.*sensitive stomach/i,
    sizes: [{ size: '3.5 lb', price: 23.99, stock: 40 }, { size: '7 lb', price: 38.99, stock: 40 }] },
  { match: /hill.*science diet.*kitten.*dry cat/i,
    sizes: [{ size: '3.5 lb', price: 21.99, stock: 40 }, { size: '7 lb', price: 36.99, stock: 40 }] },
  // ── NULO CAT REMAINING ────────────────────────────────────────────────────
  { match: /nulo.*senior.*dry cat/i,
    sizes: [{ size: '5 lb', price: 23.99, stock: 40 }, { size: '12 lb', price: 45.99, stock: 40 }] },
  { match: /nulo.*baked.*coated.*adult.*cat/i,
    sizes: [{ size: '5 lb', price: 24.99, stock: 40 }, { size: '12 lb', price: 44.99, stock: 40 }] },
  { match: /nulo.*all.in.one.*all life stages.*dry.*cat/i,
    sizes: [{ size: '5 lb', price: 17.99, stock: 40 }, { size: '12 lb', price: 34.99, stock: 40 }] },
  // ── DOG FOOD BRANDS ───────────────────────────────────────────────────────
  { match: /purina pro plan.*puppy.*dry dog/i,
    sizes: [{ size: '6 lb', price: 19.99, stock: 40 }, { size: '18 lb', price: 49.99, stock: 40 }, { size: '34 lb', price: 77.49, stock: 40 }] },
  { match: /purina pro plan.*sport.*adult.*dry dog/i,
    sizes: [{ size: '6 lb', price: 22.49, stock: 40 }, { size: '18 lb', price: 54.49, stock: 40 }, { size: '37.5 lb', price: 89.99, stock: 40 }] },
  { match: /purina pro plan.*adult.*toy.*small breed.*dry dog/i,
    sizes: [{ size: '5 lb', price: 16.99, stock: 40 }, { size: '16 lb', price: 44.99, stock: 40 }] },
  { match: /hill.*science diet.*adult.*dry dog.*chicken/i,
    sizes: [{ size: '4 lb', price: 22.99, stock: 40 }, { size: '15.5 lb', price: 57.99, stock: 40 }, { size: '30 lb', price: 99.99, stock: 40 }] },
  { match: /blue buffalo.*life protection.*adult.*dry dog.*chicken/i,
    sizes: [{ size: '5 lb', price: 19.99, stock: 40 }, { size: '15 lb', price: 49.99, stock: 40 }, { size: '30 lb', price: 79.99, stock: 40 }] },
  { match: /simply nourish.*large breed.*adult dog/i,
    sizes: [{ size: '6 lb', price: 27.99, stock: 40 }, { size: '14 lb', price: 48.99, stock: 40 }, { size: '30 lb', price: 74.99, stock: 40 }] },
  { match: /simply nourish.*adult dog/i,
    sizes: [{ size: '6 lb', price: 24.99, stock: 40 }, { size: '14 lb', price: 44.99, stock: 40 }, { size: '26 lb', price: 68.99, stock: 40 }] },
  { match: /merrick.*classic.*adult.*dry dog/i,
    sizes: [{ size: '4 lb', price: 17.99, stock: 40 }, { size: '12 lb', price: 39.99, stock: 40 }, { size: '25 lb', price: 64.99, stock: 40 }] },
  { match: /merrick.*grain free.*adult.*dry dog/i,
    sizes: [{ size: '4 lb', price: 19.99, stock: 40 }, { size: '12 lb', price: 44.99, stock: 40 }, { size: '22 lb', price: 69.99, stock: 40 }] },
  { match: /authority.*everyday health.*adult.*dry dog/i,
    sizes: [{ size: '5 lb', price: 14.99, stock: 40 }, { size: '14 lb', price: 27.99, stock: 40 }, { size: '30 lb', price: 43.99, stock: 40 }] },
  { match: /nutro wholesome essentials.*adult.*dry dog/i,
    sizes: [{ size: '5 lb', price: 17.99, stock: 40 }, { size: '15 lb', price: 44.99, stock: 40 }, { size: '30 lb', price: 72.99, stock: 40 }] },
  { match: /nutro wholesome essentials.*puppy.*dry dog/i,
    sizes: [{ size: '5 lb', price: 17.99, stock: 40 }, { size: '15 lb', price: 44.99, stock: 40 }, { size: '30 lb', price: 72.99, stock: 40 }] },
  { match: /royal canin.*labrador retriever.*adult.*dry dog/i,
    sizes: [{ size: '6 lb', price: 29.99, stock: 40 }, { size: '17 lb', price: 69.99, stock: 40 }, { size: '30 lb', price: 99.99, stock: 40 }] },
  { match: /royal canin.*golden retriever.*adult.*dry dog/i,
    sizes: [{ size: '6 lb', price: 29.99, stock: 40 }, { size: '17 lb', price: 69.99, stock: 40 }, { size: '30 lb', price: 99.99, stock: 40 }] },
  { match: /royal canin.*german shepherd.*adult.*dry dog/i,
    sizes: [{ size: '6 lb', price: 29.99, stock: 40 }, { size: '17 lb', price: 69.99, stock: 40 }, { size: '30 lb', price: 99.99, stock: 40 }] },
  { match: /royal canin.*poodle.*adult.*dry dog/i,
    sizes: [{ size: '3 lb', price: 24.99, stock: 40 }, { size: '10 lb', price: 62.99, stock: 40 }] },
  { match: /royal canin.*yorkshire terrier.*adult.*dry dog/i,
    sizes: [{ size: '3 lb', price: 24.99, stock: 40 }, { size: '10 lb', price: 62.99, stock: 40 }] },
  { match: /royal canin.*chihuahua.*adult.*dry dog/i,
    sizes: [{ size: '3 lb', price: 24.99, stock: 40 }, { size: '10 lb', price: 62.99, stock: 40 }] },
  { match: /royal canin.*miniature.*adult.*dry dog/i,
    sizes: [{ size: '3.5 lb', price: 24.99, stock: 40 }, { size: '10 lb', price: 62.99, stock: 40 }] },
  { match: /royal canin.*small.*adult.*dry dog/i,
    sizes: [{ size: '2.5 lb', price: 17.99, stock: 40 }, { size: '7 lb', price: 39.99, stock: 40 }, { size: '14 lb', price: 62.99, stock: 40 }] },
  { match: /royal canin.*medium.*adult.*dry dog/i,
    sizes: [{ size: '6 lb', price: 24.99, stock: 40 }, { size: '11 lb', price: 42.99, stock: 40 }, { size: '30 lb', price: 77.99, stock: 40 }] },
  { match: /royal canin.*large.*adult.*dry dog/i,
    sizes: [{ size: '6 lb', price: 25.99, stock: 40 }, { size: '17 lb', price: 52.99, stock: 40 }, { size: '35 lb', price: 84.99, stock: 40 }] },
  { match: /wellness.*core.*adult.*dry dog/i,
    sizes: [{ size: '4 lb', price: 21.99, stock: 40 }, { size: '12.5 lb', price: 54.99, stock: 40 }, { size: '26 lb', price: 89.99, stock: 40 }] },
  { match: /blue buffalo.*wilderness.*adult.*dry dog/i,
    sizes: [{ size: '4.5 lb', price: 22.99, stock: 40 }, { size: '11 lb', price: 44.99, stock: 40 }, { size: '24 lb', price: 77.99, stock: 40 }] },
];

function findSizes(name) {
  for (const entry of CATALOG) {
    if (entry.match.test(name)) return entry.sizes;
  }
  return null;
}

async function updateVariants(productId, currentVariants, newSizes) {
  const existingPrices = new Set(currentVariants.map(v => String(v.price)));
  const toAdd = newSizes.filter(s => !existingPrices.has(String(s.price)));
  const needsLabels = currentVariants.some(v => !v.size);
  if (toAdd.length === 0 && !needsLabels) return { skipped: true };

  const priceToSize = Object.fromEntries(newSizes.map(s => [String(s.price), s.size]));
  const cleanExisting = currentVariants.map(({ _id, ...v }) => {
    const c = { ...v, attributes: {} };
    if (!c.size && priceToSize[String(v.price)]) {
      c.size = priceToSize[String(v.price)];
      c.attributes = { size: c.size };
    }
    return c;
  });

  const allVariants = [
    ...cleanExisting,
    ...toAdd.map((s, i) => ({
      size: s.size, price: s.price, stock: s.stock,
      sku: `${productId}-sz${cleanExisting.length + i + 1}`,
      attributes: { size: s.size },
    })),
  ];

  const res = await apiRequest('PUT', `/products/${productId}`, {
    variants: allVariants,
    basePrice: Math.min(...allVariants.map(v => v.price)),
    totalStock: allVariants.reduce((a, v) => a + (v.stock || 0), 0),
  });

  return (res.success || res.data)
    ? { added: toAdd.length, total: allVariants.length }
    : { error: JSON.stringify(res).slice(0, 120) };
}

const FOOD_CATS = ['dry food','wet food','canned food','puppy food','kitten food',
  'food toppers','freeze dried','jerky treats','dental treats',
  'biscuits','food & treats','puppy treats','bones, bully','fresh & frozen'];

async function main() {
  await login();
  let checked = 0, matched = 0, updated = 0, errors = 0;

  for (let page = 1; page <= 102; page++) {
    const res = await apiRequest('GET', `/products?limit=100&page=${page}`);
    const products = res.data || [];
    if (!products.length) break;

    for (const p of products) {
      const catName = (typeof p.category === 'object' ? p.category?.name : '') || '';
      if (!FOOD_CATS.some(f => catName.toLowerCase().includes(f))) continue;
      if ((p.variants || []).length > 1) continue;
      checked++;

      const sizes = findSizes(p.name);
      if (!sizes) continue;
      matched++;
      console.log(`[${matched}] ${p.name.substring(0, 65)}`);

      try {
        const r = await updateVariants(p._id, p.variants || [], sizes);
        if (r.skipped) { console.log(`  ⏭  Already done`); }
        else if (r.added !== undefined) { updated++; console.log(`  ✅ +${r.added} sizes (total ${r.total})`); }
        else { errors++; console.log(`  ❌ ${r.error}`); }
      } catch(e) { errors++; console.log(`  ❌ ${e.message}`); }
      await new Promise(r => setTimeout(r, 300));
    }

    if (page % 10 === 0) console.log(`\n--- Page ${page}: ${checked} food checked, ${matched} matched, ${updated} updated, ${errors} errors ---\n`);
    await new Promise(r => setTimeout(r, 350));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`COMPLETE — checked: ${checked} | matched: ${matched} | updated: ${updated} | errors: ${errors}`);
}

main().catch(console.error);

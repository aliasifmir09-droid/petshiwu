/**
 * addFoodVariants3.mjs — Round 3: All remaining dry food brands
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
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('timeout')); });
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

const CATALOG = [
  // ── BLUE BUFFALO DRY ──────────────────────────────────────────────────────
  { match: /blue buffalo.*wilderness.*adult.*cat.*duck/i,
    sizes: [{ size: '5 lb', price: 22.99, stock: 40 }, { size: '11 lb', price: 40.99, stock: 40 }] },
  { match: /blue buffalo.*tastefuls.*senior.*7\+/i,
    sizes: [{ size: '7 lb', price: 27.99, stock: 40 }, { size: '15 lb', price: 44.99, stock: 40 }] },
  { match: /blue buffalo.*wilderness.*kitten.*cat/i,
    sizes: [{ size: '5 lb', price: 22.99, stock: 40 }, { size: '11 lb', price: 40.99, stock: 40 }] },
  // ── PURINA PRO PLAN CAT REMAINING ─────────────────────────────────────────
  { match: /purina pro plan.*vital systems.*senior.*cat/i,
    sizes: [{ size: '5.5 lb', price: 26.48, stock: 40 }, { size: '11 lb', price: 44.99, stock: 40 }] },
  { match: /purina pro plan.*sensitive skin.*stomach.*adult.*cat/i,
    sizes: [{ size: '3.5 lb', price: 14.49, stock: 40 }, { size: '7 lb', price: 24.49, stock: 40 }, { size: '16 lb', price: 49.99, stock: 40 }] },
  { match: /purina pro plan.*liveclear.*sensitive.*skin.*allergen/i,
    sizes: [{ size: '3.5 lb', price: 14.49, stock: 40 }, { size: '7 lb', price: 23.49, stock: 40 }] },
  { match: /purina pro plan.*cat.*kitten.*dry food.*chicken.*6 lb/i,
    sizes: [{ size: '3.5 lb', price: 14.99, stock: 40 }, { size: '6 lb', price: 27.09, stock: 40 }] },
  { match: /purina pro plan.*complete essentials.*cat.*salmon/i,
    sizes: [{ size: '3.5 lb', price: 13.99, stock: 40 }, { size: '7 lb', price: 24.49, stock: 40 }, { size: '16 lb', price: 49.99, stock: 40 }] },
  // ── PURINA ONE CAT REMAINING ──────────────────────────────────────────────
  { match: /purina one.*liveclear.*kitten/i,
    sizes: [{ size: '3.2 lb', price: 12.99, stock: 40 }, { size: '7 lb', price: 18.99, stock: 40 }] },
  { match: /purina one.*vibrant maturity.*senior.*cat/i,
    sizes: [{ size: '3.5 lb', price: 10.29, stock: 40 }, { size: '7 lb', price: 17.98, stock: 40 }, { size: '22 lb', price: 37.99, stock: 40 }] },
  { match: /purina one.*ideal weight.*adult.*cat/i,
    sizes: [{ size: '3.5 lb', price: 10.29, stock: 40 }, { size: '7 lb', price: 17.99, stock: 40 }, { size: '22 lb', price: 37.99, stock: 40 }] },
  { match: /purina one.*large breed.*puppy.*dog/i,
    sizes: [{ size: '8 lb', price: 14.99, stock: 40 }, { size: '16 lb', price: 31.99, stock: 40 }, { size: '31.1 lb', price: 54.99, stock: 40 }] },
  // ── PURINA BEYOND REMAINING ───────────────────────────────────────────────
  { match: /purina.*beyond.*grain free.*adult.*cat.*chicken/i,
    sizes: [{ size: '5 lb', price: 13.99, stock: 40 }, { size: '11 lb', price: 22.48, stock: 40 }] },
  { match: /purina.*beyond.*kitten.*cat.*dry food/i,
    sizes: [{ size: '3 lb', price: 9.99, stock: 40 }, { size: '5 lb', price: 13.99, stock: 40 }, { size: '11 lb', price: 18.69, stock: 40 }] },
  // ── PURINA CAT CHOW ───────────────────────────────────────────────────────
  { match: /purina cat chow.*complete.*all life stages.*cat/i,
    sizes: [{ size: '3.15 lb', price: 6.29, stock: 40 }, { size: '6.3 lb', price: 9.99, stock: 40 }, { size: '15 lb', price: 16.99, stock: 40 }] },
  { match: /purina cat chow.*complete.*high.protein.*salmon/i,
    sizes: [{ size: '3.15 lb', price: 6.29, stock: 40 }, { size: '13 lb', price: 13.99, stock: 40 }] },
  { match: /purina cat chow.*indoor.*adult.*cat/i,
    sizes: [{ size: '3.5 lb', price: 6.99, stock: 40 }, { size: '7 lb', price: 9.99, stock: 40 }, { size: '15 lb', price: 16.99, stock: 40 }] },
  // ── PURINA KITTEN CHOW ────────────────────────────────────────────────────
  { match: /purina kitten chow.*naturals.*kitten/i,
    sizes: [{ size: '2.8 lb', price: 7.99, stock: 40 }, { size: '6.3 lb', price: 11.99, stock: 40 }] },
  // ── PURINA PUPPY CHOW ─────────────────────────────────────────────────────
  { match: /purina puppy chow.*complete.*lamb/i,
    sizes: [{ size: '3.5 lb', price: 5.69, stock: 40 }, { size: '8.8 lb', price: 9.99, stock: 40 }, { size: '16.3 lb', price: 15.19, stock: 40 }] },
  { match: /puppy chow.*tender.*crunchy.*beef/i,
    sizes: [{ size: '8.8 lb', price: 9.99, stock: 40 }, { size: '15 lb', price: 15.19, stock: 40 }, { size: '32 lb', price: 28.99, stock: 40 }] },
  // ── PURINA BENEFUL ────────────────────────────────────────────────────────
  { match: /purina beneful.*healthy puppy.*dog/i,
    sizes: [{ size: '3.5 lb', price: 5.99, stock: 40 }, { size: '15.5 lb', price: 17.99, stock: 40 }, { size: '31.1 lb', price: 29.99, stock: 40 }] },
  // ── ROYAL CANIN REMAINING ─────────────────────────────────────────────────
  { match: /royal canin.*american shorthair.*adult.*cat/i,
    sizes: [{ size: '5.5 lb', price: 45.99, stock: 40 }, { size: '10 lb', price: 72.99, stock: 40 }] },
  { match: /royal canin.*hair.*skin.*dry.*adult.*cat/i,
    sizes: [{ size: '3 lb', price: 28.99, stock: 40 }, { size: '7 lb', price: 45.99, stock: 40 }, { size: '14 lb', price: 72.99, stock: 40 }] },
  { match: /royal canin.*pug.*puppy.*dog/i,
    sizes: [{ size: '2.5 lb', price: 27.99, stock: 40 }, { size: '10 lb', price: 72.99, stock: 40 }] },
  { match: /royal canin.*small indoor puppy.*dog/i,
    sizes: [{ size: '2.5 lb', price: 22.99, stock: 40 }, { size: '7 lb', price: 47.99, stock: 40 }] },
  // ── FANCY FEAST DRY CAT ───────────────────────────────────────────────────
  { match: /fancy feast.*all life stages.*cat.*dry food/i,
    sizes: [{ size: '3 lb', price: 10.18, stock: 40 }, { size: '7 lb', price: 18.99, stock: 40 }] },
  { match: /fancy feast.*kitten.*chicken.*turkey.*dry/i,
    sizes: [{ size: '2.5 lb', price: 10.39, stock: 40 }, { size: '7 lb', price: 18.99, stock: 40 }] },
  { match: /fancy feast.*medleys.*dry cat food/i,
    sizes: [{ size: '6.5 lb', price: 18.99, stock: 40 }] },
  // ── NULO PROWESS REMAINING ────────────────────────────────────────────────
  { match: /nulo prowess.*skin.*coat.*adult.*cat/i,
    sizes: [{ size: '5 lb', price: 17.99, stock: 40 }, { size: '12 lb', price: 34.99, stock: 40 }] },
  { match: /nulo prowess.*mature.*12\+.*senior.*cat/i,
    sizes: [{ size: '5 lb', price: 17.99, stock: 40 }, { size: '12 lb', price: 34.99, stock: 40 }] },
  { match: /nulo prowess.*h[ae][ae]lth[y]? weight.*adult.*cat/i,
    sizes: [{ size: '5 lb', price: 17.99, stock: 40 }, { size: '12 lb', price: 34.99, stock: 40 }] },
  // ── IAMS REMAINING ────────────────────────────────────────────────────────
  { match: /iams.*proactive health.*senior.*dry cat.*healthy aging/i,
    sizes: [{ size: '3.5 lb', price: 10.99, stock: 40 }, { size: '7 lb', price: 18.99, stock: 40 }, { size: '16 lb', price: 32.99, stock: 40 }] },
  { match: /iams.*proactive health.*puppy.*dry dog.*healthy development.*small/i,
    sizes: [{ size: '4 lb', price: 11.49, stock: 40 }, { size: '15 lb', price: 24.99, stock: 40 }] },
  { match: /iams.*proactive health.*puppy.*dry dog.*healthy development/i,
    sizes: [{ size: '6 lb', price: 11.99, stock: 40 }, { size: '15 lb', price: 23.99, stock: 40 }, { size: '30 lb', price: 39.99, stock: 40 }] },
  // ── EUKANUBA PUPPY ────────────────────────────────────────────────────────
  { match: /eukanuba.*small breed.*puppy.*dog/i,
    sizes: [{ size: '5 lb', price: 14.99, stock: 40 }, { size: '16 lb', price: 44.99, stock: 40 }] },
  { match: /eukanuba.*large breed.*puppy.*dog/i,
    sizes: [{ size: '5 lb', price: 19.99, stock: 40 }, { size: '30 lb', price: 59.99, stock: 40 }] },
  { match: /eukanuba.*medium breed.*puppy.*dog/i,
    sizes: [{ size: '5 lb', price: 14.99, stock: 40 }, { size: '30 lb', price: 44.99, stock: 40 }] },
  // ── PEDIGREE PUPPY ────────────────────────────────────────────────────────
  { match: /pedigree.*growth.*protection.*puppy.*dry dog/i,
    sizes: [{ size: '3.5 lb', price: 5.99, stock: 40 }, { size: '8.5 lb', price: 10.99, stock: 40 }, { size: '16.3 lb', price: 16.99, stock: 40 }] },
  // ── NUTRO PUPPY DOG ───────────────────────────────────────────────────────
  { match: /nutro max.*large breed.*puppy.*dog.*chicken/i,
    sizes: [{ size: '15 lb', price: 39.99, stock: 40 }, { size: '30 lb', price: 54.99, stock: 40 }] },
  { match: /nutro natural choice.*puppy.*lamb.*brown rice/i,
    sizes: [{ size: '5 lb', price: 20.99, stock: 40 }, { size: '15 lb', price: 37.99, stock: 40 }, { size: '28 lb', price: 56.99, stock: 40 }] },
  { match: /nutro ultra.*puppy.*dry dog.*chicken.*lamb.*salmon/i,
    sizes: [{ size: '4.5 lb', price: 23.99, stock: 40 }, { size: '15 lb', price: 52.99, stock: 40 }, { size: '30 lb', price: 86.99, stock: 40 }] },
  { match: /nutro natural choice.*puppy.*dry dog.*chicken.*brown rice/i,
    sizes: [{ size: '5 lb', price: 14.99, stock: 40 }, { size: '15 lb', price: 37.99, stock: 40 }, { size: '28 lb', price: 56.99, stock: 40 }] },
  // ── MERRICK PUPPY DOG ─────────────────────────────────────────────────────
  { match: /merrick.*healthy grains.*puppy.*dry dog.*chicken/i,
    sizes: [{ size: '4 lb', price: 23.99, stock: 40 }, { size: '12 lb', price: 52.99, stock: 40 }] },
  { match: /merrick.*raw.coated.*kibble.*puppy.*dry dog/i,
    sizes: [{ size: '4 lb', price: 25.99, stock: 40 }, { size: '12 lb', price: 59.99, stock: 40 }] },
  { match: /merrick.*lil.*plates.*small breed.*puppy.*dry dog/i,
    sizes: [{ size: '4 lb', price: 23.99, stock: 40 }, { size: '12 lb', price: 52.99, stock: 40 }] },
  // ── SIMPLY NOURISH REMAINING ──────────────────────────────────────────────
  { match: /simply nourish.*source.*kitten.*turkey.*chicken/i,
    sizes: [{ size: '4 lb', price: 27.99, stock: 40 }, { size: '12 lb', price: 59.99, stock: 40 }] },
  { match: /simply nourish.*source.*kitten.*salmon/i,
    sizes: [{ size: '4 lb', price: 19.99, stock: 40 }, { size: '12 lb', price: 49.99, stock: 40 }] },
  { match: /simply nourish.*urinary tract.*hairball.*adult.*cat/i,
    sizes: [{ size: '3.5 lb', price: 15.99, stock: 40 }, { size: '7 lb', price: 27.99, stock: 40 }] },
  { match: /simply nourish.*puppy.*dry dog/i,
    sizes: [{ size: '6 lb', price: 14.99, stock: 40 }, { size: '14 lb', price: 27.99, stock: 40 }, { size: '30 lb', price: 43.99, stock: 40 }] },
  // ── SOLID GOLD ────────────────────────────────────────────────────────────
  { match: /solid gold.*indigo moon.*cat.*kitten/i,
    sizes: [{ size: '3 lb', price: 17.99, stock: 40 }, { size: '6 lb', price: 29.99, stock: 40 }] },
  { match: /solid gold.*let.*stay in.*indoor.*adult.*cat/i,
    sizes: [{ size: '3 lb', price: 17.99, stock: 40 }, { size: '6 lb', price: 29.99, stock: 40 }] },
  { match: /solid gold.*wolf cub.*puppy.*dry dog/i,
    sizes: [{ size: '4 lb', price: 24.99, stock: 40 }, { size: '15 lb', price: 59.99, stock: 40 }, { size: '28 lb', price: 79.99, stock: 40 }] },
  // ── CANIDAE ───────────────────────────────────────────────────────────────
  { match: /canidae.*pure.*puppy.*salmon.*oatmeal/i,
    sizes: [{ size: '4 lb', price: 22.99, stock: 40 }, { size: '12 lb', price: 51.99, stock: 40 }, { size: '22 lb', price: 69.99, stock: 40 }] },
  { match: /canidae.*pure.*farm.*bowl.*puppy/i,
    sizes: [{ size: '4 lb', price: 21.99, stock: 40 }, { size: '12 lb', price: 51.99, stock: 40 }] },
  { match: /canidae.*pure.*puppy.*dry dog.*limited ingredient/i,
    sizes: [{ size: '4 lb', price: 16.99, stock: 40 }, { size: '12 lb', price: 39.99, stock: 40 }] },
  { match: /canidae.*pure.*puppy.*dry dog.*wild.caught salmon/i,
    sizes: [{ size: '4 lb', price: 21.99, stock: 40 }, { size: '12 lb', price: 51.99, stock: 40 }] },
  // ── GREENIES ──────────────────────────────────────────────────────────────
  { match: /greenies.*smart essentials.*puppy.*dry dog/i,
    sizes: [{ size: '5.5 lb', price: 15.97, stock: 40 }, { size: '15.5 lb', price: 31.97, stock: 40 }, { size: '28 lb', price: 47.97, stock: 40 }] },
  // ── FRISKIES ──────────────────────────────────────────────────────────────
  { match: /friskies.*seafood sensations.*adult.*dry cat/i,
    sizes: [{ size: '3.15 lb', price: 5.39, stock: 40 }, { size: '7 lb', price: 10.99, stock: 40 }, { size: '22 lb', price: 26.99, stock: 40 }] },
  { match: /friskies.*adult.*dry cat/i,
    sizes: [{ size: '3.15 lb', price: 5.39, stock: 40 }, { size: '7 lb', price: 10.99, stock: 40 }, { size: '22 lb', price: 26.99, stock: 40 }] },
  // ── TEMPTATIONS KITTEN ────────────────────────────────────────────────────
  { match: /temptations.*kitten.*dry cat/i,
    sizes: [{ size: '3.08 lb', price: 5.99, stock: 40 }, { size: '6.3 lb', price: 10.99, stock: 40 }] },
  // ── MEOW MIX REMAINING ────────────────────────────────────────────────────
  { match: /meow mix.*indoor.*dry cat/i,
    sizes: [{ size: '2.5 lb', price: 5.19, stock: 40 }, { size: '6.3 lb', price: 9.99, stock: 40 }] },
  { match: /meow mix.*kitten.*nibbles.*dry cat/i,
    sizes: [{ size: '2.5 lb', price: 5.19, stock: 40 }, { size: '6.3 lb', price: 9.99, stock: 40 }] },
  // ── MADE BY NACHO DRY ─────────────────────────────────────────────────────
  { match: /made by nacho.*cat.*dry food.*chicken.*pumpkin/i,
    sizes: [{ size: '3 lb', price: 17.99, stock: 40 }, { size: '6 lb', price: 29.99, stock: 40 }, { size: '11 lb', price: 47.99, stock: 40 }] },
  // ── RACHAEL RAY NUTRISH ───────────────────────────────────────────────────
  { match: /rachael ray nutrish.*puppy.*dry dog/i,
    sizes: [{ size: '3.5 lb', price: 8.99, stock: 40 }, { size: '14 lb', price: 22.99, stock: 40 }, { size: '28 lb', price: 39.99, stock: 40 }] },
  // ── NATURE'S RECIPE ───────────────────────────────────────────────────────
  { match: /nature.*recipe.*puppy.*dry dog/i,
    sizes: [{ size: '4 lb', price: 7.49, stock: 40 }, { size: '12 lb', price: 17.99, stock: 40 }, { size: '24 lb', price: 31.99, stock: 40 }] },
  // ── STELLA & CHEWY'S PUPPY ────────────────────────────────────────────────
  { match: /stella.*chewy.*freeze.dried.*raw.*dinner.*puppy.*dog/i,
    sizes: [{ size: '14 oz', price: 35.99, stock: 40 }, { size: '25 oz', price: 52.99, stock: 40 }] },
  // ── THE HONEST KITCHEN ────────────────────────────────────────────────────
  { match: /honest kitchen.*grain free.*clusters.*puppy.*dry dog/i,
    sizes: [{ size: '5 lb', price: 29.39, stock: 40 }, { size: '20 lb', price: 79.99, stock: 40 }] },
  // ── ONLY NATURAL PET ──────────────────────────────────────────────────────
  { match: /only natural pet.*powerfood.*puppy.*dry dog.*grain free/i,
    sizes: [{ size: '4 lb', price: 10.47, stock: 40 }, { size: '12 lb', price: 24.99, stock: 40 }] },
  { match: /only natural pet.*powerfood.*puppy.*dry dog/i,
    sizes: [{ size: '4 lb', price: 10.47, stock: 40 }, { size: '14 lb', price: 34.99, stock: 40 }] },
  // ── NATURAL BALANCE ───────────────────────────────────────────────────────
  { match: /natural balance.*health protection.*puppy.*dry dog/i,
    sizes: [{ size: '5 lb', price: 19.99, stock: 40 }, { size: '28 lb', price: 49.99, stock: 40 }] },
  // ── JINX PUPPY ────────────────────────────────────────────────────────────
  { match: /jinx.*puppy.*dog food/i,
    sizes: [{ size: '4 lb', price: 9.19, stock: 40 }, { size: '12.5 lb', price: 24.99, stock: 40 }, { size: '23.5 lb', price: 44.99, stock: 40 }] },
  // ── EDGARD & COOPER ───────────────────────────────────────────────────────
  { match: /edgard.*cooper.*grain free.*puppy.*dry dog/i,
    sizes: [{ size: '2.5 lb', price: 9.99, stock: 40 }, { size: '5.5 lb', price: 17.99, stock: 40 }] },
  // ── BIL-JAC ───────────────────────────────────────────────────────────────
  { match: /bil.jac.*small breed.*puppy.*dry dog/i,
    sizes: [{ size: '6 lb', price: 22.99, stock: 40 }, { size: '30 lb', price: 59.99, stock: 40 }] },
  // ── MCLOVIN'S PET DRY ─────────────────────────────────────────────────────
  { match: /mclovin.*butcher.*recipe.*dog.*freeze.dried/i,
    sizes: [{ size: '14 oz', price: 19.99, stock: 40 }, { size: '25 oz', price: 34.99, stock: 40 }] },
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
      sku: `${productId}-r3-sz${cleanExisting.length + i + 1}`,
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
    let res;
    try {
      res = await apiRequest('GET', `/products?limit=100&page=${page}`);
    } catch(e) {
      console.log(`Page ${page} fetch error: ${e.message}`);
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }
    const products = res.data || [];
    if (!products.length) {
      console.log(`Page ${page}: empty or bad response (keys: ${Object.keys(res).join(',')}), stopping`);
      break;
    }

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

    if (page % 5 === 0) console.log(`--- p${page}: ${checked} food checked, ${matched} matched, ${updated} updated ---`);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n=== DONE: checked ${checked} | matched ${matched} | updated ${updated} | errors ${errors} ===`);
}

main().catch(console.error);

/**
 * addFoodVariants4.mjs — Round 4: Remaining brands
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
  // ── TIKI CAT DRY ──────────────────────────────────────────────────────────
  { match: /tiki cat.*born carnivore.*silver.*11\+/i,
    sizes: [{ size: '2.8 lb', price: 18.99, stock: 40 }, { size: '5.6 lb', price: 24.69, stock: 40 }] },
  { match: /tiki cat.*born carnivore.*indoor health/i,
    sizes: [{ size: '2.8 lb', price: 18.99, stock: 40 }, { size: '5.6 lb', price: 31.34, stock: 40 }] },
  { match: /tiki cat.*born carnivore.*high protein/i,
    sizes: [{ size: '5 lb', price: 26.59, stock: 40 }, { size: '11 lb', price: 39.89, stock: 40 }] },
  { match: /tiki cat.*born carnivore.*hairball/i,
    sizes: [{ size: '2.8 lb', price: 12.99, stock: 40 }, { size: '5.6 lb', price: 18.99, stock: 40 }] },
  { match: /tiki cat.*born carnivore.*adult cat/i,
    sizes: [{ size: '2.8 lb', price: 12.99, stock: 40 }, { size: '5.6 lb', price: 18.99, stock: 40 }] },
  { match: /tiki cat.*solutions.*digestion/i,
    sizes: [{ size: '5 lb', price: 26.59, stock: 40 }, { size: '11 lb', price: 43.69, stock: 40 }] },
  { match: /tiki cat.*solutions.*adult cat/i,
    sizes: [{ size: '2.8 lb', price: 13.49, stock: 40 }, { size: '5.6 lb', price: 26.59, stock: 40 }] },
  // ── WELLNESS COMPLETE HEALTH CAT ──────────────────────────────────────────
  { match: /wellness.*complete health.*indoor.*healthy weight.*adult.*cat/i,
    sizes: [{ size: '2.25 lb', price: 12.99, stock: 40 }, { size: '5 lb', price: 22.79, stock: 40 }] },
  { match: /wellness.*complete health.*indoor.*adult.*cat/i,
    sizes: [{ size: '2.25 lb', price: 12.99, stock: 40 }, { size: '5 lb', price: 22.79, stock: 40 }] },
  { match: /wellness.*complete health.*kitten.*dry.*cat/i,
    sizes: [{ size: '2.25 lb', price: 12.99, stock: 40 }, { size: '5 lb', price: 22.79, stock: 40 }] },
  { match: /wellness.*complete health.*senior.*cat/i,
    sizes: [{ size: '2.25 lb', price: 12.99, stock: 40 }, { size: '5 lb', price: 22.79, stock: 40 }] },
  { match: /wellness.*complete health.*small breed.*puppy.*dog/i,
    sizes: [{ size: '5 lb', price: 19.99, stock: 40 }, { size: '12 lb', price: 41.99, stock: 40 }] },
  { match: /wellness.*complete health.*puppy.*dog/i,
    sizes: [{ size: '5 lb', price: 19.99, stock: 40 }, { size: '12 lb', price: 44.99, stock: 40 }] },
  { match: /wellness.*complete health.*adult.*cat.*grain free/i,
    sizes: [{ size: '2.25 lb', price: 12.99, stock: 40 }, { size: '5 lb', price: 18.99, stock: 40 }, { size: '12 lb', price: 35.19, stock: 40 }] },
  { match: /wellness.*complete health.*adult.*cat/i,
    sizes: [{ size: '2.25 lb', price: 12.99, stock: 40 }, { size: '5 lb', price: 18.99, stock: 40 }, { size: '12 lb', price: 35.19, stock: 40 }] },
  // ── WELLNESS CORE CAT ─────────────────────────────────────────────────────
  { match: /wellness.*core\+.*hairball.*adult.*cat/i,
    sizes: [{ size: '4.75 lb', price: 24.89, stock: 40 }, { size: '10 lb', price: 44.99, stock: 40 }] },
  { match: /wellness.*core\+.*digestive.*adult.*cat/i,
    sizes: [{ size: '4.75 lb', price: 24.89, stock: 40 }, { size: '10 lb', price: 44.99, stock: 40 }] },
  { match: /wellness.*core.*kitten.*dry.*cat/i,
    sizes: [{ size: '5 lb', price: 24.69, stock: 40 }, { size: '11 lb', price: 44.99, stock: 40 }] },
  { match: /wellness.*core.*puppy.*dry.*dog.*small breed/i,
    sizes: [{ size: '4 lb', price: 20.99, stock: 40 }, { size: '11 lb', price: 42.99, stock: 40 }] },
  { match: /wellness.*core.*digestive.*puppy.*dog/i,
    sizes: [{ size: '4 lb', price: 23.99, stock: 40 }, { size: '11 lb', price: 46.99, stock: 40 }] },
  { match: /wellness.*core.*puppy.*dry.*dog/i,
    sizes: [{ size: '4 lb', price: 20.99, stock: 40 }, { size: '11 lb', price: 42.99, stock: 40 }] },
  { match: /wellness.*core\+.*freeze.*dried.*puppy.*dog/i,
    sizes: [{ size: '4 lb', price: 23.99, stock: 40 }, { size: '11 lb', price: 46.99, stock: 40 }] },
  // ── BLUE BUFFALO REMAINING CAT ────────────────────────────────────────────
  { match: /blue buffalo.*tastefuls.*multi.protein.*adult.*cat/i,
    sizes: [{ size: '5 lb', price: 16.99, stock: 40 }, { size: '10 lb', price: 29.59, stock: 40 }] },
  { match: /blue buffalo.*tastefuls.*weight.*hairball.*control.*adult.*cat/i,
    sizes: [{ size: '7 lb', price: 24.99, stock: 40 }, { size: '15 lb', price: 46.99, stock: 40 }] },
  { match: /blue buffalo.*tastefuls.*weight control.*adult.*cat/i,
    sizes: [{ size: '7 lb', price: 24.99, stock: 40 }, { size: '15 lb', price: 44.99, stock: 40 }] },
  { match: /blue buffalo.*tastefuls.*active.*adult.*cat/i,
    sizes: [{ size: '7 lb', price: 31.99, stock: 40 }, { size: '15 lb', price: 46.99, stock: 40 }] },
  { match: /blue buffalo.*true solutions.*hairball.*adult.*cat/i,
    sizes: [{ size: '5 lb', price: 20.98, stock: 40 }, { size: '11 lb', price: 40.99, stock: 40 }] },
  { match: /blue buffalo.*true solutions.*adult.*cat/i,
    sizes: [{ size: '5 lb', price: 20.98, stock: 40 }, { size: '11 lb', price: 40.99, stock: 40 }] },
  { match: /blue buffalo.*wilderness.*weight control.*adult.*cat/i,
    sizes: [{ size: '5 lb', price: 22.99, stock: 40 }, { size: '11 lb', price: 40.99, stock: 40 }] },
  { match: /blue buffalo.*wilderness.*all life stages.*cat/i,
    sizes: [{ size: '5 lb', price: 22.99, stock: 40 }, { size: '11 lb', price: 40.99, stock: 40 }] },
  { match: /blue buffalo.*wilderness.*senior.*cat/i,
    sizes: [{ size: '5 lb', price: 22.99, stock: 40 }, { size: '11 lb', price: 40.99, stock: 40 }] },
  { match: /blue buffalo.*wilderness.*adult.*cat.*high protein/i,
    sizes: [{ size: '5 lb', price: 24.99, stock: 40 }, { size: '11 lb', price: 46.99, stock: 40 }] },
  { match: /blue buffalo.*freedom.*adult.*cat/i,
    sizes: [{ size: '5 lb', price: 22.99, stock: 40 }, { size: '11 lb', price: 46.98, stock: 40 }] },
  { match: /blue buffalo.*basics.*senior.*cat/i,
    sizes: [{ size: '5 lb', price: 22.99, stock: 40 }, { size: '11 lb', price: 47.99, stock: 40 }] },
  { match: /blue buffalo.*baby blue.*kitten.*dry.*cat/i,
    sizes: [{ size: '4 lb', price: 15.99, stock: 40 }, { size: '10 lb', price: 23.49, stock: 40 }] },
  // ── BLUE BUFFALO PUPPY DOG ────────────────────────────────────────────────
  { match: /blue buffalo.*baby blue.*small breed.*puppy.*dog/i,
    sizes: [{ size: '5 lb', price: 12.49, stock: 40 }, { size: '15 lb', price: 26.99, stock: 40 }] },
  { match: /blue buffalo.*baby blue.*puppy.*dry dog/i,
    sizes: [{ size: '5 lb', price: 15.99, stock: 40 }, { size: '12 lb', price: 30.99, stock: 40 }, { size: '24 lb', price: 58.99, stock: 40 }] },
  { match: /blue buffalo.*wilderness.*rocky mountain.*puppy.*dog/i,
    sizes: [{ size: '4.5 lb', price: 25.99, stock: 40 }, { size: '10.5 lb', price: 47.99, stock: 40 }] },
  { match: /blue buffalo.*wilderness.*large breed.*puppy.*dog/i,
    sizes: [{ size: '10.5 lb', price: 47.99, stock: 40 }, { size: '24 lb', price: 76.99, stock: 40 }] },
  { match: /blue buffalo.*wilderness.*puppy.*dry dog/i,
    sizes: [{ size: '4.5 lb', price: 25.99, stock: 40 }, { size: '10.5 lb', price: 47.99, stock: 40 }] },
  { match: /blue buffalo.*freedom.*puppy.*dry dog/i,
    sizes: [{ size: '5 lb', price: 19.99, stock: 40 }, { size: '11 lb', price: 35.99, stock: 40 }] },
  // ── APPLAWS DRY CAT ───────────────────────────────────────────────────────
  { match: /applaws.*kitten.*dry cat/i,
    sizes: [{ size: '1.06 lb', price: 9.99, stock: 40 }, { size: '2.65 lb', price: 19.99, stock: 40 }] },
  { match: /applaws.*adult.*dry cat/i,
    sizes: [{ size: '1.06 lb', price: 9.99, stock: 40 }, { size: '2.65 lb', price: 17.99, stock: 40 }] },
  // ── AUTHORITY DRY CAT ─────────────────────────────────────────────────────
  { match: /authority.*healthy weight.*adult.*cat/i,
    sizes: [{ size: '6 lb', price: 17.99, stock: 40 }, { size: '14 lb', price: 29.99, stock: 40 }] },
  { match: /authority.*digestive support.*adult.*cat/i,
    sizes: [{ size: '6 lb', price: 17.99, stock: 40 }, { size: '14 lb', price: 27.99, stock: 40 }] },
  { match: /authority.*everyday health.*indoor.*cat/i,
    sizes: [{ size: '6 lb', price: 18.99, stock: 40 }, { size: '14 lb', price: 27.99, stock: 40 }] },
  // ── MADE BY NACHO DRY CAT ─────────────────────────────────────────────────
  { match: /made by nacho.*dry cat food.*freeze dried raw/i,
    sizes: [{ size: '4 lb', price: 27.99, stock: 40 }, { size: '9 lb', price: 51.99, stock: 40 }] },
  { match: /made by nacho.*dry cat.*bone broth/i,
    sizes: [{ size: '4 lb', price: 12.99, stock: 40 }, { size: '10 lb', price: 24.99, stock: 40 }] },
  { match: /made by nacho.*cat.*dry food.*chicken.*pumpkin.*11 lb/i,
    sizes: [{ size: '4 lb', price: 24.99, stock: 40 }, { size: '11 lb', price: 47.99, stock: 40 }] },
  { match: /made by nacho.*cat.*dry food.*chicken.*duck.*quail/i,
    sizes: [{ size: '4 lb', price: 27.99, stock: 40 }, { size: '10 lb', price: 51.99, stock: 40 }] },
  { match: /made by nacho.*cat.*dry food.*salmon.*whitefish/i,
    sizes: [{ size: '4 lb', price: 27.99, stock: 40 }, { size: '10 lb', price: 51.99, stock: 40 }] },
  { match: /made by nacho.*kitten.*cat food/i,
    sizes: [{ size: '4 lb', price: 13.99, stock: 40 }, { size: '10 lb', price: 27.99, stock: 40 }] },
  // ── INSTINCT DRY CAT ──────────────────────────────────────────────────────
  { match: /instinct.*raw boost.*indoor.*all life stage.*cat/i,
    sizes: [{ size: '4 lb', price: 31.99, stock: 40 }, { size: '9.5 lb', price: 63.99, stock: 40 }] },
  { match: /instinct.*raw boost.*cat.*chicken/i,
    sizes: [{ size: '4 lb', price: 33.99, stock: 40 }, { size: '9.5 lb', price: 63.99, stock: 40 }] },
  { match: /instinct.*raw boost.*cat/i,
    sizes: [{ size: '4 lb', price: 33.99, stock: 40 }, { size: '9.5 lb', price: 63.99, stock: 40 }] },
  { match: /instinct.*ultimate protein.*adult.*cat/i,
    sizes: [{ size: '4 lb', price: 36.99, stock: 40 }, { size: '10 lb', price: 74.99, stock: 40 }] },
  { match: /instinct.*original.*cat.*salmon/i,
    sizes: [{ size: '4 lb', price: 31.99, stock: 40 }, { size: '10 lb', price: 65.99, stock: 40 }] },
  { match: /instinct.*original.*cat/i,
    sizes: [{ size: '4 lb', price: 31.99, stock: 40 }, { size: '10 lb', price: 65.99, stock: 40 }] },
  // ── INSTINCT PUPPY DOG ────────────────────────────────────────────────────
  { match: /instinct.*raw meals.*freeze.dried.*puppy.*dog/i,
    sizes: [{ size: '4.5 lb', price: 27.99, stock: 40 }, { size: '10 lb', price: 56.99, stock: 40 }] },
  { match: /instinct.*raw boost.*whole grain.*puppy.*dog/i,
    sizes: [{ size: '4 lb', price: 36.99, stock: 40 }, { size: '10 lb', price: 81.99, stock: 40 }] },
  // ── PURINA PRO PLAN CAT REMAINING ─────────────────────────────────────────
  { match: /purina pro plan.*prime plus.*senior.*dry cat/i,
    sizes: [{ size: '3.5 lb', price: 17.99, stock: 40 }, { size: '7.4 lb', price: 29.29, stock: 40 }] },
  { match: /purina pro plan.*indoor.*hairball.*adult.*dry cat/i,
    sizes: [{ size: '3.5 lb', price: 11.49, stock: 40 }, { size: '7 lb', price: 16.88, stock: 40 }] },
  { match: /purina pro plan.*indoor.*adult.*dry cat/i,
    sizes: [{ size: '3.5 lb', price: 13.49, stock: 40 }, { size: '7 lb', price: 16.89, stock: 40 }] },
  { match: /purina pro plan.*liveclear.*indoor.*allergen.*adult.*cat/i,
    sizes: [{ size: '3.5 lb', price: 14.49, stock: 40 }, { size: '7 lb', price: 23.49, stock: 40 }] },
  { match: /purina pro plan.*liveclear.*allergen.*adult.*cat/i,
    sizes: [{ size: '3.5 lb', price: 14.49, stock: 40 }, { size: '7 lb', price: 23.49, stock: 40 }, { size: '16 lb', price: 47.99, stock: 40 }] },
  { match: /purina pro plan.*hairball control.*dry cat/i,
    sizes: [{ size: '3.5 lb', price: 13.99, stock: 40 }, { size: '7 lb', price: 24.49, stock: 40 }, { size: '16 lb', price: 49.99, stock: 40 }] },
  { match: /purina pro plan.*all life stages.*dry cat/i,
    sizes: [{ size: '7 lb', price: 28.09, stock: 40 }, { size: '16 lb', price: 53.49, stock: 40 }] },
  { match: /purina pro plan.*focus.*sensitive skin.*kitten.*dry/i,
    sizes: [{ size: '3.5 lb', price: 13.99, stock: 40 }, { size: '7 lb', price: 19.19, stock: 40 }] },
  { match: /purina pro plan.*focus.*adult.*dry cat/i,
    sizes: [{ size: '3.5 lb', price: 13.49, stock: 40 }, { size: '7 lb', price: 24.49, stock: 40 }] },
  { match: /purina pro plan.*specialized.*hairball.*cat/i,
    sizes: [{ size: '3.5 lb', price: 13.99, stock: 40 }, { size: '7 lb', price: 24.49, stock: 40 }, { size: '16 lb', price: 34.99, stock: 40 }] },
  { match: /purina pro plan.*complete essentials.*dry cat.*shredded blend/i,
    sizes: [{ size: '3.5 lb', price: 13.99, stock: 40 }, { size: '7 lb', price: 27.09, stock: 40 }] },
  { match: /purina pro plan.*vital systems.*kitten.*dry/i,
    sizes: [{ size: '3.5 lb', price: 14.99, stock: 40 }, { size: '7 lb', price: 23.48, stock: 40 }] },
  // ── PURINA CAT CHOW / KITTEN CHOW remaining ──────────────────────────────
  { match: /purina cat chow.*complete.*all life stages/i,
    sizes: [{ size: '3.15 lb', price: 6.29, stock: 40 }, { size: '6.3 lb', price: 9.99, stock: 40 }, { size: '15 lb', price: 16.99, stock: 40 }] },
  { match: /purina cat chow.*indoor.*adult.*cat/i,
    sizes: [{ size: '3.5 lb', price: 6.99, stock: 40 }, { size: '7 lb', price: 9.99, stock: 40 }] },
  { match: /purina kitten chow.*naturals.*kitten/i,
    sizes: [{ size: '2.8 lb', price: 7.99, stock: 40 }, { size: '6.3 lb', price: 11.99, stock: 40 }] },
  // ── ROYAL CANIN PUPPY ─────────────────────────────────────────────────────
  { match: /royal canin.*golden retriever.*puppy.*dog/i,
    sizes: [{ size: '6 lb', price: 32.99, stock: 40 }, { size: '17 lb', price: 65.99, stock: 40 }, { size: '30 lb', price: 104.99, stock: 40 }] },
  { match: /royal canin.*german shepherd.*puppy.*dog/i,
    sizes: [{ size: '6 lb', price: 32.99, stock: 40 }, { size: '17 lb', price: 65.99, stock: 40 }, { size: '30 lb', price: 104.99, stock: 40 }] },
  { match: /royal canin.*small breed starter.*puppy.*dog/i,
    sizes: [{ size: '3 lb', price: 23.99, stock: 40 }, { size: '7 lb', price: 44.99, stock: 40 }] },
  // ── NULO PUPPY DOG ────────────────────────────────────────────────────────
  { match: /nulo.*medalseries.*puppy.*dry dog/i,
    sizes: [{ size: '5 lb', price: 26.99, stock: 40 }, { size: '12 lb', price: 51.99, stock: 40 }, { size: '25 lb', price: 74.99, stock: 40 }] },
  // ── MERRICK BACKCOUNTRY PUPPY ─────────────────────────────────────────────
  { match: /merrick.*backcountry.*puppy.*dry dog/i,
    sizes: [{ size: '4 lb', price: 27.99, stock: 40 }, { size: '12 lb', price: 59.99, stock: 40 }] },
  // ── MCLOVIN'S PET DOG ─────────────────────────────────────────────────────
  { match: /mclovin.*fin.*farm.*dog/i,
    sizes: [{ size: '14 oz', price: 19.99, stock: 40 }, { size: '25 oz', price: 34.99, stock: 40 }] },
  { match: /mclovin.*nana.*recipe.*dog/i,
    sizes: [{ size: '14 oz', price: 19.99, stock: 40 }, { size: '25 oz', price: 34.99, stock: 40 }] },
  // ── SIMPLY NOURISH PUPPY DOG ──────────────────────────────────────────────
  { match: /simply nourish.*source.*puppy.*dog/i,
    sizes: [{ size: '4 lb', price: 17.99, stock: 40 }, { size: '14 lb', price: 54.99, stock: 40 }] },
  // ── NUTRO MAX PUPPY DOG ───────────────────────────────────────────────────
  { match: /nutro max.*puppy.*dry dog.*chicken/i,
    sizes: [{ size: '5 lb', price: 16.99, stock: 40 }, { size: '15 lb', price: 31.99, stock: 40 }] },
  // ── NATURE'S RECIPE PUPPY ─────────────────────────────────────────────────
  { match: /nature.*recipe.*puppy.*dry dog/i,
    sizes: [{ size: '4 lb', price: 7.49, stock: 40 }, { size: '12 lb', price: 17.99, stock: 40 }, { size: '24 lb', price: 31.99, stock: 40 }] },
  // ── ONLY NATURAL PET PUPPY ────────────────────────────────────────────────
  { match: /only natural pet.*powerfood.*puppy.*dry dog.*grain free/i,
    sizes: [{ size: '4 lb', price: 10.47, stock: 40 }, { size: '12 lb', price: 24.99, stock: 40 }] },
  // ── EUKANUBA PREMIUM PERFORMANCE ─────────────────────────────────────────
  { match: /eukanuba.*premium performance.*puppy/i,
    sizes: [{ size: '15 lb', price: 54.99, stock: 40 }, { size: '30 lb', price: 99.99, stock: 40 }] },
  // ── REVEAL DRY CAT ────────────────────────────────────────────────────────
  { match: /reveal.*kitten.*dry.*grain free/i,
    sizes: [{ size: '2.5 lb', price: 11.99, stock: 40 }, { size: '5.5 lb', price: 14.99, stock: 40 }] },
  // ── NULO PROWESS (catch remaining) ────────────────────────────────────────
  { match: /nulo prowess.*h[ae]alth[y]?.*weight.*adult.*cat/i,
    sizes: [{ size: '5 lb', price: 17.99, stock: 40 }, { size: '12 lb', price: 34.99, stock: 40 }] },
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
      sku: `${productId}-r4-sz${cleanExisting.length + i + 1}`,
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
      console.log(`p${page} err: ${e.message}`);
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }
    const products = res.data || [];
    if (!products.length) { console.log(`p${page}: empty, stopping`); break; }

    for (const p of products) {
      const catName = (typeof p.category === 'object' ? p.category?.name : '') || '';
      if (!FOOD_CATS.some(f => catName.toLowerCase().includes(f))) continue;
      if ((p.variants || []).length > 1) continue;
      checked++;

      const sizes = findSizes(p.name);
      if (!sizes) continue;
      matched++;

      try {
        const r = await updateVariants(p._id, p.variants || [], sizes);
        if (r.skipped) { console.log(`⏭  ${p.name.substring(0, 55)}`); }
        else if (r.added !== undefined) {
          updated++;
          console.log(`✅ [${updated}] +${r.added}sz → ${p.name.substring(0, 55)}`);
        } else { errors++; console.log(`❌ ${p.name.substring(0, 40)} — ${r.error}`); }
      } catch(e) { errors++; console.log(`❌ ${p.name.substring(0, 40)} — ${e.message}`); }
      await new Promise(r => setTimeout(r, 250));
    }

    if (page % 5 === 0) console.log(`--- p${page}: ${checked} food, ${matched} matched, ${updated} updated ---`);
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n=== DONE: ${checked} food | ${matched} matched | ${updated} updated | ${errors} errors ===`);
}

main().catch(console.error);

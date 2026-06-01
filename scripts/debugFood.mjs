import https from 'https';

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const url = new URL('https://petshiwu.onrender.com/api/v1' + path);
    const req = https.get({
      hostname: url.hostname, path: url.pathname + url.search,
      headers: { Accept: 'application/json' }, timeout: 25000
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Just look at page 4 which had food in the Python scan
const res = await apiGet('/products?limit=100&page=4');
const products = res.data || [];
console.log(`Page 4: ${products.length} products`);

// Print all category names and variant counts
const catMap = {};
for (const p of products) {
  const cat = p.category;
  const catName = typeof cat === 'object' ? (cat?.name || 'OBJ_NO_NAME') : (cat || 'STRING:' + cat);
  const nv = (p.variants||[]).length;
  const key = catName + '|' + nv;
  catMap[key] = (catMap[key]||0) + 1;
}

// Print unique category+variant combos
Object.entries(catMap).sort().forEach(([k,v]) => console.log(`  ${v}x  ${k}`));

// Print a few product details
console.log('\nFirst 5 products on page 4:');
products.slice(0,5).forEach(p => {
  const cat = p.category;
  const catName = typeof cat === 'object' ? cat?.name : cat;
  console.log(`  name: ${p.name?.substring(0,50)}`);
  console.log(`  catType: ${typeof cat}, catName: ${catName}`);
  console.log(`  variants: ${(p.variants||[]).length}`);
  console.log();
});

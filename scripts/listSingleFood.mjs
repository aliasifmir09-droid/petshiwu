import https from 'https';

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const url = new URL('https://petshiwu.onrender.com/api/v1' + path);
    const req = https.get({
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: { Accept: 'application/json' },
      timeout: 25000
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

const FOOD_CATS = ['dry food','wet food','canned food','puppy food','kitten food',
  'food toppers','freeze dried','jerky treats','dental treats','biscuits',
  'food & treats','bones, bully','puppy treats'];

const single = [];
for (let page = 1; page <= 12; page++) {
  const res = await apiGet(`/products?limit=100&page=${page}`);
  const products = res.data || [];
  if (!products.length) break;
  for (const p of products) {
    const cat = (typeof p.category === 'object' ? p.category?.name : '') || '';
    if (FOOD_CATS.some(f => cat.toLowerCase().includes(f)) && (p.variants||[]).length <= 1) {
      single.push({
        id: p._id,
        name: p.name,
        brand: p.brand,
        price: p.variants?.[0]?.price || p.basePrice,
        cat
      });
    }
  }
  await new Promise(r => setTimeout(r, 250));
}

single.sort((a,b) => b.price - a.price);
console.log(`Single-variant food products (first 1200 scanned): ${single.length}`);
single.slice(0, 40).forEach(p =>
  console.log(`  [$${String(p.price).padStart(6)}] [${p.cat.substring(0,18)}] ${p.name.substring(0,55)}`)
);

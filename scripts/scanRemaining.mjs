// Scan pages 14-30 where food products live, log unmatched single-variant ones
import https from 'https';
import fs from 'fs';

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const url = new URL('https://petshiwu.onrender.com/api/v1' + path);
    const req = https.get({
      hostname: url.hostname, path: url.pathname + url.search,
      headers: { Accept: 'application/json' }, timeout: 20000
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

const FOOD_CATS = ['dry food','wet food','canned food','puppy food','kitten food',
  'food toppers','freeze dried','jerky treats','dental treats',
  'biscuits','food & treats','puppy treats','bones, bully','fresh & frozen'];

const single = [];

// Scan pages 14-35 (where food lives based on prior scans)
for (let page = 1; page <= 40; page++) {
  try {
    const res = await apiGet(`/products?limit=100&page=${page}`);
    const products = res.data || [];
    if (!products.length) break;
    for (const p of products) {
      const cat = typeof p.category === 'object' ? p.category : {};
      const catName = (cat.name || '').toLowerCase();
      if (!FOOD_CATS.some(f => catName.includes(f))) continue;
      if ((p.variants || []).length > 1) continue;
      single.push({
        id: p._id,
        name: p.name,
        brand: p.brand || '',
        cat: cat.name || '',
        price: p.variants?.[0]?.price ?? p.basePrice ?? 0,
        size: p.variants?.[0]?.size ?? ''
      });
    }
    if (page % 5 === 0) process.stderr.write(`Page ${page}, found ${single.length} so far\n`);
    await new Promise(r => setTimeout(r, 150));
  } catch(e) {
    process.stderr.write(`Page ${page} err: ${e.message}\n`);
  }
}

// Group by brand
const brands = {};
for (const p of single) {
  brands[p.brand] = (brands[p.brand] || []);
  brands[p.brand].push(p);
}

process.stderr.write(`\nTotal single-variant food products: ${single.length}\n\n`);
process.stderr.write('By brand:\n');
Object.entries(brands)
  .sort((a,b) => b[1].length - a[1].length)
  .forEach(([b, ps]) => {
    process.stderr.write(`  ${String(ps.length).padStart(3)}  ${b}\n`);
    ps.slice(0, 3).forEach(p =>
      process.stderr.write(`       $${String(p.price).padStart(6)} [${p.cat}] ${p.name.substring(0,55)}\n`)
    );
  });

// Write full list to file for catalog building
fs.writeFileSync('/workspace/petshiwu/scripts/remaining_single.json', JSON.stringify(single, null, 2));
process.stderr.write('\nSaved to remaining_single.json\n');

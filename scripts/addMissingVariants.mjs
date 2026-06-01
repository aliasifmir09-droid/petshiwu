import https from 'https';
import http from 'http';

const API_BASE = 'https://petshiwu.onrender.com/api/v1';
const SEARCH_API = 'https://www.googleapis.com/customsearch/v1'; // won't use - will do web search differently

// Admin token
let TOKEN = '';

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login() {
  const res = await apiRequest('POST', '/auth/login', {
    email: 'admin@petshiwu.com',
    password: '@Admin,1+23as'
  });
  TOKEN = res.token || res.data?.token;
  console.log('Logged in, token:', TOKEN ? 'OK' : 'FAILED');
}

// Known PetSmart size+price data by brand/keyword from Google research
// Format: match keywords → array of {size, price, stock}
const PETSMART_SIZE_DATA = {
  // DRY DOG FOOD
  'purina pro plan adult dry dog food.*chicken.*rice': [
    { size: '6 lb', price: 16.58, stock: 50 },
    { size: '18 lb', price: 47.99, stock: 50 },
    { size: '35 lb', price: 74.49, stock: 50 },
    { size: '47 lb', price: 96.49, stock: 50 }
  ],
  'purina pro plan.*sensitive.*salmon.*rice': [
    { size: '6 lb', price: 20.68, stock: 50 },
    { size: '16 lb', price: 50.49, stock: 50 },
    { size: '30 lb', price: 77.49, stock: 50 },
    { size: '41 lb', price: 94.99, stock: 50 }
  ],
  'purina pro plan.*large breed.*chicken.*rice': [
    { size: '18 lb', price: 54.49, stock: 50 },
    { size: '34 lb', price: 77.49, stock: 50 },
    { size: '47 lb', price: 97.99, stock: 50 }
  ],
  'hill.*science diet.*sensitive stomach.*chicken': [
    { size: '4 lb', price: 23.99, stock: 50 },
    { size: '15.5 lb', price: 59.99, stock: 50 },
    { size: '30 lb', price: 104.99, stock: 50 }
  ],
  'hill.*science diet.*perfect weight.*chicken': [
    { size: '6.8 lb', price: 25.99, stock: 50 },
    { size: '15 lb', price: 59.99, stock: 50 },
    { size: '28.5 lb', price: 92.99, stock: 50 }
  ],
  'hill.*science diet.*adult.*chicken': [
    { size: '4 lb', price: 23.99, stock: 50 },
    { size: '15.5 lb', price: 59.99, stock: 50 },
    { size: '30 lb', price: 99.99, stock: 50 }
  ],
  'blue buffalo.*life protection.*chicken.*rice.*dog': [
    { size: '5 lb', price: 19.99, stock: 50 },
    { size: '15 lb', price: 49.99, stock: 50 },
    { size: '30 lb', price: 79.99, stock: 50 }
  ],
  'royal canin.*labrador': [
    { size: '6 lb', price: 29.99, stock: 50 },
    { size: '17 lb', price: 69.99, stock: 50 },
    { size: '30 lb', price: 99.99, stock: 50 }
  ],
  'royal canin.*golden retriever': [
    { size: '6 lb', price: 29.99, stock: 50 },
    { size: '17 lb', price: 69.99, stock: 50 },
    { size: '30 lb', price: 99.99, stock: 50 }
  ],
  'wellness core.*large breed.*puppy': [
    { size: '4 lb', price: 25.99, stock: 50 },
    { size: '12.5 lb', price: 59.99, stock: 50 },
    { size: '24 lb', price: 77.99, stock: 50 }
  ],
  'canidae pure.*bison': [
    { size: '4 lb', price: 19.99, stock: 50 },
    { size: '10 lb', price: 44.99, stock: 50 },
    { size: '24 lb', price: 69.99, stock: 50 }
  ],
  'purina one.*large breed': [
    { size: '8 lb', price: 19.99, stock: 50 },
    { size: '16.5 lb', price: 36.99, stock: 50 },
    { size: '31.1 lb', price: 49.99, stock: 50 }
  ],
  // DRY CAT FOOD
  'purina pro plan.*adult.*cat.*chicken': [
    { size: '3 lb', price: 13.99, stock: 50 },
    { size: '7 lb', price: 24.99, stock: 50 },
    { size: '16 lb', price: 49.99, stock: 50 }
  ],
  'hill.*science diet.*adult.*cat': [
    { size: '3.5 lb', price: 19.99, stock: 50 },
    { size: '7 lb', price: 34.99, stock: 50 },
    { size: '16 lb', price: 64.99, stock: 50 }
  ],
  'blue buffalo.*indoor.*cat': [
    { size: '5 lb', price: 19.99, stock: 50 },
    { size: '15 lb', price: 44.99, stock: 50 }
  ],
  // TIKI CAT MOUSSE (multipack vs single)
  'tiki cat.*solutions.*mousse.*12': [
    { size: '12 ct / 28.8 oz', price: 23.83, stock: 50 }
  ],
  'tiki cat.*solutions.*mousse.*fussy': [
    { size: '2.4 oz', price: 1.49, stock: 50 },
    { size: '12 ct / 28.8 oz', price: 23.83, stock: 50 }
  ],
  'tiki cat.*solutions.*mousse.*skin': [
    { size: '2.4 oz', price: 1.49, stock: 50 },
    { size: '12 ct / 28.8 oz', price: 23.83, stock: 50 }
  ],
};

function matchProduct(productName) {
  const nameLower = productName.toLowerCase();
  for (const [pattern, sizes] of Object.entries(PETSMART_SIZE_DATA)) {
    if (new RegExp(pattern, 'i').test(nameLower)) {
      return sizes;
    }
  }
  return null;
}

async function updateProductVariants(productId, productName, newVariants) {
  // Get full product first
  const res = await apiRequest('GET', `/products/${productId}`);
  const product = res.data || res;
  
  const currentVariants = product.variants || [];
  const currentPrices = new Set(currentVariants.map(v => String(v.price)));
  
  // Only add truly new variants
  const toAdd = newVariants.filter(v => !currentPrices.has(String(v.price)));
  if (toAdd.length === 0) {
    return { skipped: true, reason: 'all variants already exist' };
  }

  const allVariants = [...currentVariants, ...toAdd.map((v, i) => ({
    size: v.size,
    price: v.price,
    stock: v.stock || 50,
    sku: `${productId}-v${currentVariants.length + i + 1}`,
    attributes: { size: v.size }
  }))];

  const updateRes = await apiRequest('PUT', `/products/${productId}`, {
    variants: allVariants,
    basePrice: Math.min(...allVariants.map(v => v.price))
  });
  
  return { success: true, added: toAdd.length, total: allVariants.length };
}

async function main() {
  await login();
  
  // Get food products with 1 variant, page by page
  let matched = 0, updated = 0, page = 1;
  const FOOD_CATS = ['dry food','wet food','canned food','puppy food','kitten food',
    'food toppers','freeze dried','fresh & frozen','jerky treats',
    'dental treats','biscuits','bones, bully','food & treats'];
  
  console.log('Scanning food products...');
  
  while (page <= 30) {
    const res = await apiRequest('GET', `/products?limit=100&page=${page}`);
    const products = res.data || [];
    if (!products.length) break;
    
    for (const p of products) {
      const catName = (typeof p.category === 'object' ? p.category?.name : '') || '';
      const isFoodCat = FOOD_CATS.some(fc => catName.toLowerCase().includes(fc));
      if (!isFoodCat) continue;
      if ((p.variants || []).length > 1) continue;
      
      const sizes = matchProduct(p.name);
      if (!sizes) continue;
      
      matched++;
      console.log(`\n[${matched}] ${p.name.substring(0, 60)}`);
      console.log(`  Current: ${p.variants?.length || 0} variant(s)`);
      console.log(`  Adding: ${sizes.map(s => s.size + ' $' + s.price).join(', ')}`);
      
      try {
        const result = await updateProductVariants(p._id, p.name, sizes);
        if (result.success) {
          updated++;
          console.log(`  ✅ Added ${result.added} variants (total: ${result.total})`);
        } else {
          console.log(`  ⏭ Skipped: ${result.reason}`);
        }
      } catch (e) {
        console.log(`  ❌ Error: ${e.message}`);
      }
      
      await new Promise(r => setTimeout(r, 200));
    }
    
    page++;
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n=== DONE: matched ${matched} products, updated ${updated} ===`);
}

main().catch(console.error);

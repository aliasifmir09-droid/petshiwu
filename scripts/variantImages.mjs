/**
 * variantImages.mjs
 * Scrapes PetSmart for per-variant images and stores them in Bunny CDN.
 * Each variant gets its own image: products/{productId}_v{variantIndex}.jpg
 * Updates variant.image field in MongoDB.
 *
 * Usage: node scripts/variantImages.mjs [--limit=100] [--dry-run]
 */

import { MongoClient, ObjectId } from 'mongodb';
import https from 'https';
import http from 'http';

const MONGO_URI = 'mongodb+srv://admin:admin123@cluster0.xejhsy6.mongodb.net/petshop?retryWrites=true&w=majority';
const BUNNY_STORAGE_HOST = 'storage.bunnycdn.com';
const BUNNY_STORAGE_ZONE = 'petshiwu-cdn';
const BUNNY_STORAGE_PASSWORD = 'ad8f1a46-6aa8-45fa-b07f8d43fe40-5801-4f31';
const BUNNY_CDN_BASE = 'https://petshiwu-cdn.b-cdn.net/products';
const PETSMART_SEARCH = 'https://www.petsmart.com/search/?q=';

const args = process.argv.slice(2);
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50');
const DRY_RUN = args.includes('--dry-run');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': options.binary ? 'image/*' : 'text/html,application/xhtml+xml',
        ...options.headers
      },
      timeout: 15000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, options).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function uploadToBunny(buffer, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BUNNY_STORAGE_HOST,
      path: `/${BUNNY_STORAGE_ZONE}/${path}`,
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_STORAGE_PASSWORD,
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length
      }
    };
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

// Extract scene7 image ID from PetSmart search result HTML for a specific search term + size
async function findVariantImage(productName, sizeValue) {
  const query = encodeURIComponent(`${productName} ${sizeValue}`);
  const url = `${PETSMART_SEARCH}${query}`;
  
  try {
    const res = await fetchUrl(url);
    const html = res.body.toString('utf8');
    
    // Find first product image in search results
    // PetSmart uses scene7: "scene7.com/is/image/PetSmart/XXXXXXXX"
    const match = html.match(/scene7\.com\/is\/image\/PetSmart\/([A-Za-z0-9_-]+)/);
    if (!match) return null;
    
    const scene7Id = match[1];
    // Skip non-product scene7 IDs (brand logos, UI elements)
    if (!/\d{7,}/.test(scene7Id) && !/^[A-Z]{2,}_/.test(scene7Id)) return null;
    
    const imageUrl = `https://s7d2.scene7.com/is/image/PetSmart/${scene7Id}?$sclp-prd-main_hero$`;
    
    // Verify the image is real and large enough
    const imgRes = await fetchUrl(imageUrl, { binary: true });
    if (imgRes.status !== 200 || imgRes.body.length < 20000) return null;
    
    return { url: imageUrl, buffer: imgRes.body, scene7Id };
  } catch {
    return null;
  }
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('petshop');
  const products = db.collection('products');

  // Find products with multiple size/weight variants and no per-variant images
  const query = {
    isActive: true,
    deletedAt: null,
    'variants.1': { $exists: true }, // at least 2 variants
  };

  const allProducts = await products.find(query).limit(LIMIT * 3).toArray();
  
  // Filter to only size/weight variant products
  const sizeProducts = allProducts.filter(p => {
    return p.variants?.some(v =>
      v.attributes && Object.values(v.attributes).some(val =>
        /\d+\s*(lb|kg|oz|g|ml|l|liter)/i.test(String(val))
      )
    );
  }).slice(0, LIMIT);

  console.log(`Found ${sizeProducts.length} products with size variants to process`);
  if (DRY_RUN) console.log('DRY RUN — no uploads or DB updates');

  let updated = 0, skipped = 0, errors = 0;

  for (const product of sizeProducts) {
    const productId = product._id.toString();
    const productName = product.name.replace(/[&#;].*?;/g, '').replace(/[^a-zA-Z0-9 ]/g, ' ').trim().slice(0, 60);
    
    let productUpdated = false;
    const variantUpdates = {};

    for (let i = 0; i < product.variants.length; i++) {
      const variant = product.variants[i];
      
      // Skip if variant already has an image
      if (variant.image || (variant.images && variant.images.length > 0)) {
        continue;
      }
      
      // Get size value from attributes
      const sizeVal = Object.values(variant.attributes || {}).find(v =>
        /\d+\s*(lb|kg|oz|g|ml|l)/i.test(String(v))
      );
      if (!sizeVal) continue;

      const bunnyPath = `products/${productId}_v${i}.jpg`;
      const cdnUrl = `${BUNNY_CDN_BASE}/${productId}_v${i}.jpg`;

      try {
        const result = await findVariantImage(productName, sizeVal);
        if (!result) {
          skipped++;
          continue;
        }

        if (!DRY_RUN) {
          const uploadStatus = await uploadToBunny(result.buffer, bunnyPath);
          if (uploadStatus !== 201) {
            console.log(`  Upload failed (${uploadStatus}) for ${productName} ${sizeVal}`);
            errors++;
            continue;
          }
          variantUpdates[`variants.${i}.image`] = cdnUrl;
        }
        
        console.log(`  ✓ ${productName} | ${sizeVal} → ${cdnUrl}`);
        productUpdated = true;
        await sleep(500); // be gentle with PetSmart
      } catch (err) {
        console.log(`  ✗ ${productName} ${sizeVal}: ${err.message}`);
        errors++;
      }
    }

    if (productUpdated && !DRY_RUN && Object.keys(variantUpdates).length > 0) {
      await products.updateOne({ _id: product._id }, { $set: variantUpdates });
      updated++;
    }
  }

  console.log(`\nDone. Updated: ${updated} products | Skipped: ${skipped} | Errors: ${errors}`);
  await client.close();
}

main().catch(console.error);

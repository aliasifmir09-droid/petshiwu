import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URI);
await client.connect();
const db = client.db('petshop');

// Get all unique Bunny URLs (images[] now has all 8 per product as Bunny URLs)
const products = await db.collection('products').find({}, { projection: { images: 1, bunnyImage: 1 } }).toArray();
await client.close();

const urls = new Set();
for (const p of products) {
  if (p.bunnyImage) urls.add(p.bunnyImage);
  if (p.images) p.images.forEach(img => { if (img?.includes('b-cdn.net')) urls.add(img); });
}

const list = [...urls];
console.log(`Warming ${list.length} unique Bunny URLs...`);

let done = 0, errors = 0;
const CONCURRENCY = 80;

async function warm(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    if (r.ok) done++;
    else errors++;
  } catch { errors++; }
}

for (let i = 0; i < list.length; i += CONCURRENCY) {
  const batch = list.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(warm));
  if ((i + CONCURRENCY) % 2000 === 0) {
    console.log(`  ${i + CONCURRENCY}/${list.length} warmed (${errors} errors)`);
  }
}

console.log(`Done. ${done} cached, ${errors} errors.`);

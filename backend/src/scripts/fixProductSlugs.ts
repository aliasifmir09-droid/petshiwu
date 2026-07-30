/**
 * fixProductSlugs.ts — One-time migration to fix HTML entity artifacts in product slugs
 *
 * Replaces: amp → and, 039 → (removed), ampamp → and, ampampamp → and,
 *           quot → '', ampquot → '', double-dash → single-dash
 * Saves old slug to product.legacySlugs[] for redirect purposes
 *
 * Run: ts-node src/scripts/fixProductSlugs.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pet-ecommerce';

const cleanSlug = (s: string): string => s
  .replace(/ampampampamp+/gi, 'and')
  .replace(/ampampamp/gi, 'and')
  .replace(/ampampquot/gi, '')
  .replace(/quot/gi, '')
  .replace(/ampamp/gi, 'and')
  .replace(/(?:^|-)amp(?:$|-)/gi, (m) =>
    m.startsWith('-') && m.endsWith('-') ? '-and-' : m.startsWith('-') ? '-and' : 'and-')
  .replace(/039/g, '')
  .replace(/--+/g, '-')
  .replace(/^-|-$/g, '');

interface ProductDoc {
  _id: mongoose.Types.ObjectId;
  slug: string;
  legacySlugs?: string[];
}

async function run() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db!;
  const products = db.collection('products');

  // Find all products with bad slugs (expanded regex for new patterns)
  const badProducts = await products.find<ProductDoc>(
    { slug: { $regex: '039|ampampamp|ampamp|ampquot|--amp|^amp-|amp-|amp$|--' } },
    { projection: { _id: 1, slug: 1, legacySlugs: 1 } }
  ).toArray();

  console.log(`Found ${badProducts.length} products with bad slugs`);

  let updated = 0;
  let skipped = 0;
  let collision = 0;
  const log: { oldSlug: string; newSlug: string; status: string }[] = [];

  for (const product of badProducts) {
    const newSlug = cleanSlug(product.slug);
    if (newSlug === product.slug) { skipped++; continue; }

    // Check no collision with existing slug
    const existing = await products.findOne({ slug: newSlug, _id: { $ne: product._id } });
    if (existing) {
      log.push({ oldSlug: product.slug, newSlug, status: '⚠️ collision' });
      collision++;
      continue;
    }

    // Update: set new slug, preserve old in legacySlugs array
    const legacySlugs = [...(product.legacySlugs || [])];
    if (!legacySlugs.includes(product.slug)) legacySlugs.push(product.slug);

    await products.updateOne(
      { _id: product._id },
      {
        $set: { slug: newSlug, legacySlugs },
        $addToSet: { legacySlugs: { $each: legacySlugs } }
      }
    );

    log.push({ oldSlug: product.slug, newSlug, status: 'updated' });
    updated++;
    if (updated % 50 === 0) console.log(`  ${updated}/${badProducts.length} updated...`);
  }

  console.log(`\n✅ Done: ${updated} updated, ${collision} collisions, ${skipped} skipped`);
  console.log('\nSample changes:');
  log.slice(0, 10).forEach(l => console.log(`  ${l.status}: ${l.oldSlug} → ${l.newSlug}`));

  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
/**
 * fixCategorySlugs.ts — One-time migration to fix HTML entity artifacts in category slugs
 *
 * Categories also have broken slugs (e.g. "tunnels-amp-hideouts" from "Tunnels & Hideouts",
 * "bones-bully-sticks--chews" from extra-dash artifacts).
 *
 * This script:
 *   1. Finds all categories with bad slugs
 *   2. Cleans slug (amp→and, 039→'', normalize dashes)
 *   3. Saves old slug to legacySlugs[] field for redirect purposes
 *   4. Handles collisions: category.slug + petType + parentCategory is unique compound index
 *
 * Run: ts-node src/scripts/fixCategorySlugs.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pet-ecommerce';

const BAD_SLUG_RE = /039|ampamp|ampquot|--amp|--amp$|^amp-|amp-|-amp|--+/i;

const cleanSlug = (s: string): string => {
  let result = s;
  result = result.replace(/ampampamp+/gi, 'and');
  result = result.replace(/ampamp/gi, 'and');
  result = result.replace(/ampquot/gi, '');
  result = result.replace(/quot/gi, '');
  result = result.replace(/(?:^|-)amp(?:$|-)/gi, (m) =>
    m.startsWith('-') && m.endsWith('-') ? '-and-' : m.startsWith('-') ? '-and' : 'and-'
  );
  result = result.replace(/039/g, '');
  result = result.replace(/--+/g, '-');
  result = result.replace(/^-|-$/g, '');
  return result.toLowerCase().trim();
};

interface CategoryDoc {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  petType: string;
  parentCategory?: mongoose.Types.ObjectId | null;
  legacySlugs?: string[];
}

async function run() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db!;
  const categories = db.collection('categories');

  const badCats = await categories
    .find<CategoryDoc>(
      { slug: { $regex: '039|ampamp|ampquot|--amp|^amp-|amp-|amp$|--' } },
      { projection: { _id: 1, slug: 1, name: 1, petType: 1, parentCategory: 1, legacySlugs: 1 } }
    )
    .toArray();

  console.log(`Found ${badCats.length} categories with bad slugs`);

  if (badCats.length === 0) {
    console.log('Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  let skipped = 0;
  let collision = 0;
  const log: { oldSlug: string; newSlug: string; action: string }[] = [];

  for (const cat of badCats) {
    const cleaned = cleanSlug(cat.slug);
    if (cleaned === cat.slug) {
      skipped++;
      continue;
    }

    // Check collision: same (slug, petType, parentCategory) tuple
    const existing = await categories.findOne({
      slug: cleaned,
      petType: cat.petType,
      parentCategory: cat.parentCategory || null,
      _id: { $ne: cat._id }
    });

    if (existing) {
      log.push({ oldSlug: cat.slug, newSlug: cleaned, action: '⚠️ collision' });
      collision++;
      continue;
    }

    const legacySlugs = [...(cat.legacySlugs || [])];
    if (!legacySlugs.includes(cat.slug)) legacySlugs.push(cat.slug);

    await categories.updateOne(
      { _id: cat._id },
      {
        $set: { slug: cleaned },
        $addToSet: { legacySlugs: { $each: legacySlugs } }
      }
    );

    log.push({ oldSlug: cat.slug, newSlug: cleaned, action: 'updated' });
    updated++;
  }

  console.log(`\n✅ Done: ${updated} updated, ${collision} collisions, ${skipped} skipped`);
  console.log('\nChanges:');
  log.slice(0, 20).forEach((l) => console.log(`  ${l.action}: ${l.oldSlug} → ${l.newSlug}`));
  if (log.length > 20) console.log(`  ... and ${log.length - 20} more`);

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
/**
 * fixBlogSlugs.ts — One-time migration to fix HTML entity artifacts in blog slugs
 *
 * Root cause: seed scripts applied HTML-entity encoding to titles BEFORE slug generation,
 * so titles like "NYC Pet Parent's Complete Guide" became slug `nyc-pet-parent039s-complete-guide`.
 *
 * This script:
 *   1. Finds all blogs with bad slugs (039, ampamp, ampampamp, -amp-, etc.)
 *   2. Cleans the slug (ampampamp→and, 039→'', -amp-→-and-)
 *   3. Saves old slug to legacySlugs[] field for redirect purposes
 *   4. Handles the duplicate-slug case: 28+ blogs all share slug `nyc-pet-parent039s-complete-guide-...`
 *      → keep the canonical (most content), delete duplicates
 *
 * Run: ts-node src/scripts/fixBlogSlugs.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pet-ecommerce';

// Regex for ANY artifact pattern we know about
const BAD_SLUG_RE = /039|ampampamp|ampamp|ampquot|--amp--|ampquot-|-amp-|^amp-|amp-$|--+/i;

const cleanSlug = (s: string): string => {
  let result = s;
  // Collapse extreme ampamp chains first
  result = result.replace(/ampampampamp+/gi, 'and');
  result = result.replace(/ampampamp/gi, 'and');
  result = result.replace(/ampampquot/gi, ''); // "ampampquot" (quote-after-amp artifact)
  result = result.replace(/quot/gi, '');       // bare quote entities
  result = result.replace(/ampamp/gi, 'and');
  result = result.replace(/-(amp)+-/gi, '-and-');
  result = result.replace(/-(amp)+$/gi, '-and');
  result = result.replace(/^(amp)+-/gi, 'and-');
  // Standalone "amp" inside a word boundary (like "tunnels-amp-hideouts" middle, or "indoor-amp-outdoor")
  // Be careful: only replace if surrounded by hyphens or word boundaries
  result = result.replace(/(?:^|-)amp(?:$|-)/gi, (m) => m.startsWith('-') && m.endsWith('-') ? '-and-' : m.startsWith('-') ? '-and' : 'and-');
  // Now collapse the apostrophe entity
  result = result.replace(/039/g, '');
  // Normalize dash artifacts (double-dashes from broken cleanup)
  result = result.replace(/--+/g, '-');
  result = result.replace(/^-|-$/g, '');
  // Final: lowercase + trim
  return result.toLowerCase().trim();
};

interface BlogDoc {
  _id: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  content: string;
  legacySlugs?: string[];
}

async function run() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db!;
  const blogs = db.collection('blogs');

  // Find ALL blogs with bad slugs
  const badBlogs = await blogs
    .find<BlogDoc>(
      { slug: { $regex: '039|ampamp|ampquot|--amp|--amp$|^amp-|amp-|-amp' } },
      { projection: { _id: 1, slug: 1, title: 1, content: 1, legacySlugs: 1 } }
    )
    .toArray();

  console.log(`Found ${badBlogs.length} blogs with bad slugs`);

  if (badBlogs.length === 0) {
    console.log('Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  // Group by intended clean slug — to detect duplicates
  const slugGroups = new Map<string, BlogDoc[]>();
  for (const blog of badBlogs) {
    const cleaned = cleanSlug(blog.slug);
    if (!slugGroups.has(cleaned)) slugGroups.set(cleaned, []);
    slugGroups.get(cleaned)!.push(blog);
  }

  let updated = 0;
  let deleted = 0;
  let skipped = 0;
  const log: { oldSlug: string; newSlug: string; action: string }[] = [];

  for (const [cleaned, group] of slugGroups) {
    // Check if a blog already exists with the clean slug (not in our bad set)
    const existingClean = await blogs.findOne({ slug: cleaned });
    const collision = existingClean && !group.find((b) => b._id.equals(existingClean._id));

    if (group.length === 1 && !collision) {
      // Single blog, no collision — just clean its slug
      const blog = group[0];
      const legacySlugs = [...(blog.legacySlugs || [])];
      if (!legacySlugs.includes(blog.slug)) legacySlugs.push(blog.slug);

      await blogs.updateOne(
        { _id: blog._id },
        { $set: { slug: cleaned, legacySlugs }, $addToSet: { legacySlugs: { $each: legacySlugs } } }
      );

      log.push({ oldSlug: blog.slug, newSlug: cleaned, action: 'updated' });
      updated++;
    } else {
      // Multiple blogs OR collision with existing clean slug
      // Pick canonical: longest content
      group.sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0));
      const canonical = group[0];

      if (!collision) {
        // Update canonical to cleaned slug
        const legacySlugs = [...(canonical.legacySlugs || [])];
        if (!legacySlugs.includes(canonical.slug)) legacySlugs.push(canonical.slug);

        await blogs.updateOne(
          { _id: canonical._id },
          {
            $set: { slug: cleaned, legacySlugs },
            $addToSet: { legacySlugs: { $each: legacySlugs } }
          }
        );
        log.push({ oldSlug: canonical.slug, newSlug: cleaned, action: 'canonical-updated' });
        updated++;
      } else {
        // Clean slug is owned by someone else — all of group are dupes, delete all
        const ids = group.map((b) => b._id);
        await blogs.deleteMany({ _id: { $in: ids } });
        log.push({ oldSlug: canonical.slug, newSlug: cleaned, action: 'all-deleted (collision with existing clean slug)' });
        deleted += group.length;
        continue;
      }

      // Delete remaining dupes in group
      const dupeIds = group.slice(1).map((b) => b._id);
      if (dupeIds.length > 0) {
        const dupeResult = await blogs.deleteMany({ _id: { $in: dupeIds } });
        log.push({ oldSlug: `${dupeIds.length} duplicates`, newSlug: cleaned, action: 'deleted' });
        deleted += dupeResult.deletedCount || 0;
      }
    }
  }

  console.log(`\n✅ Done: ${updated} updated, ${deleted} deleted, ${skipped} skipped`);
  console.log('\nAll changes:');
  log.forEach((l) => console.log(`  ${l.action}: ${l.oldSlug} → ${l.newSlug}`));

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
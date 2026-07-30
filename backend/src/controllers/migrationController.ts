/**
 * migrationController.ts — One-time migration endpoints for fixing broken slugs.
 *
 * Run via curl after deploy:
 *   POST /api/v1/admin/migrate/slugs   { "token": "<ADMIN_JWT>" }
 *
 * Cleans:
 *   - Product slugs (amp→and, 039→'', -- → -, etc.) + saves old slugs to legacySlugs[]
 *   - Category slugs (same)
 *   - Blog slugs (same) + dedupes (deletes duplicate blogs)
 */
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import Blog from '../models/Blog';
import Category from '../models/Category';
import logger from '../utils/logger';

const cleanSlug = (s: string): string =>
  s
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

const BAD_SLUG_RE = /039|ampampamp|ampamp|ampquot|--amp|^amp-|amp-|amp$|--/;

export const migrateAllSlugs = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = mongoose.connection.db!;
    const products = db.collection('products');
    const categories = db.collection('categories');
    const blogs = db.collection('blogs');

    const summary: Record<string, unknown> = {};

    // ── Products ───────────────────────────────────────────────────────────
    const badProducts = await products
      .find({ slug: { $regex: '039|ampampamp|ampamp|ampquot|--amp|^amp-|amp-|amp$|--' } })
      .toArray();

    let pUpdated = 0, pCollisions = 0;
    for (const p of badProducts) {
      const newSlug = cleanSlug(p.slug as string);
      if (newSlug === p.slug) continue;

      const collision = await products.findOne({ slug: newSlug, _id: { $ne: p._id } });
      if (collision) { pCollisions++; continue; }

      const legacySlugs = [...((p as any).legacySlugs || [])];
      if (!legacySlugs.includes(p.slug)) legacySlugs.push(p.slug);

      await products.updateOne(
        { _id: p._id },
        { $set: { slug: newSlug, legacySlugs }, $addToSet: { legacySlugs: { $each: legacySlugs } } }
      );
      pUpdated++;
    }
    summary.products = { found: badProducts.length, updated: pUpdated, collisions: pCollisions };

    // ── Categories ─────────────────────────────────────────────────────────
    const badCats = await categories
      .find({ slug: { $regex: '039|ampamp|ampquot|--amp|^amp-|amp-|amp$|--' } })
      .toArray();

    let cUpdated = 0, cCollisions = 0;
    for (const c of badCats) {
      const newSlug = cleanSlug(c.slug as string);
      if (newSlug === c.slug) continue;

      const collision = await categories.findOne({
        slug: newSlug,
        petType: (c as any).petType,
        parentCategory: (c as any).parentCategory || null,
        _id: { $ne: c._id }
      });
      if (collision) { cCollisions++; continue; }

      const legacySlugs = [...((c as any).legacySlugs || [])];
      if (!legacySlugs.includes(c.slug)) legacySlugs.push(c.slug);

      await categories.updateOne(
        { _id: c._id },
        { $set: { slug: newSlug }, $addToSet: { legacySlugs: { $each: legacySlugs } } }
      );
      cUpdated++;
    }
    summary.categories = { found: badCats.length, updated: cUpdated, collisions: cCollisions };

    // ── Blogs (with dedup) ─────────────────────────────────────────────────
    const badBlogs = await blogs
      .find({ slug: { $regex: '039|ampamp|ampquot|--amp|^amp-|amp-|amp$|--' } })
      .toArray();

    let bUpdated = 0, bDeleted = 0;
    const slugGroups = new Map<string, any[]>();
    for (const b of badBlogs) {
      const cleaned = cleanSlug(b.slug as string);
      if (!slugGroups.has(cleaned)) slugGroups.set(cleaned, []);
      slugGroups.get(cleaned)!.push(b);
    }

    for (const [cleaned, group] of slugGroups) {
      const existingClean = await blogs.findOne({ slug: cleaned });
      const collision = existingClean && !group.find((b: any) => b._id.equals(existingClean._id));

      if (group.length === 1 && !collision) {
        const blog = group[0];
        const legacySlugs = [...((blog as any).legacySlugs || [])];
        if (!legacySlugs.includes(blog.slug)) legacySlugs.push(blog.slug);
        await blogs.updateOne(
          { _id: blog._id },
          { $set: { slug: cleaned, legacySlugs }, $addToSet: { legacySlugs: { $each: legacySlugs } } }
        );
        bUpdated++;
      } else {
        // Multiple dupes or collision — keep longest, delete others
        group.sort((a, b) => ((b.content as string)?.length || 0) - ((a.content as string)?.length || 0));
        const canonical = group[0];
        if (!collision) {
          const legacySlugs = [...((canonical as any).legacySlugs || [])];
          if (!legacySlugs.includes(canonical.slug)) legacySlugs.push(canonical.slug);
          await blogs.updateOne(
            { _id: canonical._id },
            { $set: { slug: cleaned, legacySlugs }, $addToSet: { legacySlugs: { $each: legacySlugs } } }
          );
          bUpdated++;
        }
        const dupeIds = group.slice(1).map((b: any) => b._id);
        if (dupeIds.length > 0) {
          const result = await blogs.deleteMany({ _id: { $in: dupeIds } });
          bDeleted += result.deletedCount || 0;
        }
      }
    }
    summary.blogs = { found: badBlogs.length, updated: bUpdated, deleted: bDeleted };

    logger.info('[migration] Slug migration complete', summary);
    res.json({ success: true, summary });
  } catch (err: any) {
    logger.error('[migration] Failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Silence unused-import warning while keeping types available for future endpoints
void Product; void Blog; void Category; void BAD_SLUG_RE;
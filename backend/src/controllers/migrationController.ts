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
    const skipCollisionCheck = process.env.MIGRATE_SKIP_COLLISIONS === '1';

    // ── Products (bulk write — 100x faster than per-record) ─────────────────
    const badProducts = await products
      .find({ slug: { $regex: '039|ampampamp|ampamp|ampquot|--amp|^amp-|amp-|amp$|--' } })
      .toArray();

    const pBulkOps: any[] = [];
    let pCollisions = 0;
    for (const p of badProducts) {
      const newSlug = cleanSlug(p.slug as string);
      if (newSlug === p.slug) continue;

      if (!skipCollisionCheck) {
        const collision = await products.findOne({ slug: newSlug, _id: { $ne: p._id } });
        if (collision) { pCollisions++; continue; }
      }

      const legacySlugs = [...((p as any).legacySlugs || [])];
      if (!legacySlugs.includes(p.slug)) legacySlugs.push(p.slug);

      pBulkOps.push({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { slug: newSlug, legacySlugs } }
        }
      });
    }

    const pStart = Date.now();
    if (pBulkOps.length > 0) {
      // Bulk in chunks of 100
      let pUpdated = 0;
      for (let i = 0; i < pBulkOps.length; i += 100) {
        const chunk = pBulkOps.slice(i, i + 100);
        const result = await products.bulkWrite(chunk, { ordered: false });
        pUpdated += result.modifiedCount || 0;
        logger.info(`[migrate] products progress: ${Math.min(i + 100, pBulkOps.length)}/${pBulkOps.length}`);
      }
      logger.info(`[migrate] products done: ${pUpdated}/${pBulkOps.length} (${pCollisions} collisions) in ${Date.now() - pStart}ms`);
      summary.products = { found: badProducts.length, updated: pUpdated, collisions: pCollisions };
    } else {
      summary.products = { found: badProducts.length, updated: 0, collisions: 0 };
    }

    // ── Categories (bulk) ──────────────────────────────────────────────────
          const badCats = await categories
            .find({ slug: { $regex: '039|ampamp|ampquot|--amp|^amp-|amp-|amp$|--' } })
            .toArray();

          const cBulkOps: any[] = [];
          let cCollisions = 0;
          for (const c of badCats) {
            const newSlug = cleanSlug(c.slug as string);
            if (newSlug === c.slug) continue;

            if (!skipCollisionCheck) {
              const collision = await categories.findOne({
                slug: newSlug,
                petType: (c as any).petType,
                parentCategory: (c as any).parentCategory || null,
                _id: { $ne: c._id }
              });
              if (collision) { cCollisions++; continue; }
            }

            const legacySlugs = [...((c as any).legacySlugs || [])];
            if (!legacySlugs.includes(c.slug)) legacySlugs.push(c.slug);

            cBulkOps.push({
              updateOne: {
                filter: { _id: c._id },
                update: { $set: { slug: newSlug, legacySlugs } }
              }
            });
          }

          let cUpdated = 0;
          if (cBulkOps.length > 0) {
            const result = await categories.bulkWrite(cBulkOps, { ordered: false });
            cUpdated = result.modifiedCount || 0;
          }
          summary.categories = { found: badCats.length, updated: cUpdated, collisions: cCollisions };

    // ── Blogs (with dedup, bulk) ──────────────────────────────────────────
          const badBlogs = await blogs
            .find({ slug: { $regex: '039|ampamp|ampquot|--amp|^amp-|amp-|amp$|--' } })
            .toArray();

          const bBulkOps: any[] = [];
          const deleteIds: any[] = [];
          let bDeleted = 0;

          // Group by cleaned slug to handle duplicates
          const slugGroups = new Map<string, any[]>();
          for (const b of badBlogs) {
            const cleaned = cleanSlug(b.slug as string);
            if (!slugGroups.has(cleaned)) slugGroups.set(cleaned, []);
            slugGroups.get(cleaned)!.push(b);
          }

          for (const [cleaned, group] of slugGroups) {
            if (group.length === 1) {
              // Single bad slug — just clean it
              const blog = group[0];
              const legacySlugs = [...((blog as any).legacySlugs || [])];
              if (!legacySlugs.includes(blog.slug)) legacySlugs.push(blog.slug);
              bBulkOps.push({
                updateOne: {
                  filter: { _id: blog._id },
                  update: { $set: { slug: cleaned, legacySlugs } }
                }
              });
            } else {
              // Multiple blogs with same cleaned slug — keep longest, delete others
              group.sort((a, b) => ((b.content as string)?.length || 0) - ((a.content as string)?.length || 0));
              const canonical = group[0];
              const legacySlugs = [...((canonical as any).legacySlugs || [])];
              if (!legacySlugs.includes(canonical.slug)) legacySlugs.push(canonical.slug);
              bBulkOps.push({
                updateOne: {
                  filter: { _id: canonical._id },
                  update: { $set: { slug: cleaned, legacySlugs } }
                }
              });
              // Delete the rest
              for (let i = 1; i < group.length; i++) {
                deleteIds.push(group[i]._id);
              }
            }
          }

          let bUpdated = 0;
          if (bBulkOps.length > 0) {
            const result = await blogs.bulkWrite(bBulkOps, { ordered: false });
            bUpdated = result.modifiedCount || 0;
          }
          if (deleteIds.length > 0) {
            const result = await blogs.deleteMany({ _id: { $in: deleteIds } });
            bDeleted = result.deletedCount || 0;
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
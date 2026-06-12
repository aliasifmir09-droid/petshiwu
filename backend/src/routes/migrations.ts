/**
 * migrations.ts — Secure one-time migration runner
 * Requires MIGRATION_SECRET env var. Remove this file after migrations are done.
 */
import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import logger from '../utils/logger';

const router = Router();

const cleanSlug = (s: string): string => s
  .replace(/ampampamp/g, 'and')
  .replace(/ampamp/g, 'and')
  .replace(/(^|-)amp(-|$)/g, '$1and$2')
  .replace(/039/g, '')
  .replace(/--+/g, '-')
  .replace(/^-|-$/g, '');

// POST /api/migrations/fix-slugs
// Body: { secret: "MIGRATION_SECRET_VALUE" }
router.post('/fix-slugs', async (req: Request, res: Response) => {
  const { secret } = req.body;
  const expected = process.env.MIGRATION_SECRET;
  if (!expected || secret !== expected) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    // Find all products with bad slugs
    const badProducts = await Product.find(
      { slug: { $regex: '039|-amp-|-amp$|ampamp' } },
      { _id: 1, slug: 1, legacySlugs: 1, petType: 1, category: 1 }
    ).lean();

    const results: { oldSlug: string; newSlug: string; status: string }[] = [];
    let updated = 0;
    let skipped = 0;

    for (const product of badProducts) {
      const newSlug = cleanSlug(product.slug as string);
      if (newSlug === product.slug) { skipped++; continue; }

      // Collision check
      const existing = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } }).lean();
      if (existing) {
        results.push({ oldSlug: product.slug as string, newSlug, status: 'collision_skipped' });
        skipped++;
        continue;
      }

      const legacySlugs: string[] = [...((product.legacySlugs as string[]) || [])];
      if (!legacySlugs.includes(product.slug as string)) legacySlugs.push(product.slug as string);

      await Product.updateOne(
        { _id: product._id },
        { $set: { slug: newSlug, legacySlugs } }
      );

      results.push({ oldSlug: product.slug as string, newSlug, status: 'updated' });
      updated++;
    }

    logger.info(`[migration fix-slugs] Updated: ${updated}, Skipped: ${skipped}`);
    return res.json({ success: true, updated, skipped, results });
  } catch (err: any) {
    logger.error('[migration fix-slugs] Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

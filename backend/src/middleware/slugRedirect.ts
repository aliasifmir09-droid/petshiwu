/**
 * slugRedirect.ts — 301 redirect middleware for legacy product URL slugs
 *
 * When a product slug was cleaned (HTML entities removed), old indexed URLs
 * like /dog/dry-food/hill039s-science-diet-... automatically 301 to the clean
 * canonical URL /dog/dry-food/hills-science-diet-...
 *
 * Uses the product's legacySlugs[] array (populated by fixProductSlugs migration).
 * Falls through to next() instantly for all clean URLs — zero overhead.
 */
import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import logger from '../utils/logger';

// Fast in-process cache: old slug → new path (populated on first hit, TTL 1hr)
const redirectCache = new Map<string, { to: string; expires: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Quick pre-filter: only enter DB lookup if path looks like it has an artifact
const BAD_SLUG_RE = /039|-amp-|-amp$|^amp-|ampamp/;

export const slugRedirectMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();
  if (!BAD_SLUG_RE.test(req.path)) return next();

  const segments = req.path.split('/').filter(Boolean);
  if (segments.length < 2) return next();

  const oldSlug = segments[segments.length - 1];

  // Check in-process cache first
  const cached = redirectCache.get(oldSlug);
  if (cached) {
    if (Date.now() < cached.expires) {
      res.redirect(301, cached.to);
      return;
    }
    redirectCache.delete(oldSlug);
  }

  try {
    // Look up product by old slug in legacySlugs array
    const product = await (Product as any).findOne(
      { legacySlugs: oldSlug },
      { slug: 1, petType: 1, category: 1 }
    ).lean();

    if (!product) return next(); // Not a legacy slug, serve normally

    // Build new canonical path
    const petType = product.petType || 'products';
    const categorySlug =
      typeof product.category === 'object' ? product.category?.slug : null;
    const newPath = categorySlug
      ? `/${petType}/${categorySlug}/${product.slug}`
      : `/${petType}/${product.slug}`;

    // Cache and redirect
    redirectCache.set(oldSlug, { to: newPath, expires: Date.now() + CACHE_TTL_MS });
    res.redirect(301, newPath);
    return;
  } catch (err: any) {
    logger.warn(`[slugRedirect] Error for ${req.path}:`, err?.message);
    return next();
  }
};

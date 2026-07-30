/**
 * slugRedirect.ts — 301 redirect middleware for legacy artifact URLs
 *
 * When slugs were cleaned (HTML entities removed), old indexed URLs like:
 *   /learning/nyc-pet-parent039s-complete-guide-...
 *   /dog/tunnels-amp-hideouts/full-cheeks-small-pet...
 *   /dog/bones-bully-sticks--chews/roam-exotic-ossy...
 * automatically 301 to the clean canonical URL.
 *
 * Uses legacySlugs[] array on Product, Blog, and Category models (populated by
 * fixProductSlugs, fixBlogSlugs, fixCategorySlugs migrations).
 *
 * Falls through to next() instantly for all clean URLs — zero overhead.
 */
import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import Blog from '../models/Blog';
import Category from '../models/Category';
import logger from '../utils/logger';

// Fast in-process cache: old slug → new path (TTL 1hr)
const redirectCache = new Map<string, { to: string; expires: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

// Quick pre-filter: only enter DB lookups if path looks like it has an artifact
const BAD_SLUG_RE = /039|--amp|--amp$|^amp-|amp-|-amp-|ampamp|ampquot|--+/;

interface RedirectTarget {
  newPath: string;
  source: 'product' | 'blog' | 'category';
}

/**
 * Try to resolve a single legacy slug against all three models.
 * Returns the canonical path (relative to host) or null.
 */
async function resolveLegacySlug(oldSlug: string): Promise<RedirectTarget | null> {
  // 1. Product legacy slug
  const product = await (Product as any).findOne(
    { legacySlugs: oldSlug },
    { slug: 1, petType: 1, category: 1 }
  ).lean();

  if (product) {
    const petType = product.petType || 'dog';
    let categorySlug: string | null =
      typeof product.category === 'object' && (product.category as any)?.slug
        ? (product.category as any).slug
        : null;

    if (!categorySlug && product.category) {
      try {
        const cat = await (Category as any).findById(product.category, { slug: 1 }).lean();
        categorySlug = cat?.slug || null;
      } catch (_) {
        // Non-fatal — fall back to /products/{slug}
      }
    }

    const newPath = categorySlug
      ? `/${petType}/${categorySlug}/${product.slug}`
      : `/products/${product.slug}`;
    return { newPath, source: 'product' };
  }

  // 2. Blog legacy slug
  const blog = await (Blog as any).findOne(
    { legacySlugs: oldSlug },
    { slug: 1 }
  ).lean();

  if (blog) {
    return { newPath: `/learning/${blog.slug}`, source: 'blog' };
  }

  // 3. Category legacy slug — return /category/{newSlug}
  const category = await (Category as any).findOne(
    { legacySlugs: oldSlug },
    { slug: 1, petType: 1 }
  ).lean();

  if (category) {
    const petTypeParam = category.petType && category.petType !== 'all'
      ? `?petType=${category.petType}`
      : '';
    return { newPath: `/category/${category.slug}${petTypeParam}`, source: 'category' };
  }

  return null;
}

export const slugRedirectMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();
  if (!BAD_SLUG_RE.test(req.path)) return next();

  const segments = req.path.split('/').filter(Boolean);
  if (segments.length < 1) return next();

  // Try each segment from right to left (last segment is most likely the broken one)
  // For paths like /dog/tunnels-amp-hideouts/full-cheeks-small-pet...
  // the middle segment "tunnels-amp-hideouts" is the broken category slug.

  // First: try last segment (existing product/blog behavior)
  const lastSlug = segments[segments.length - 1];

  const cacheKey = `${req.path}|${lastSlug}`;
  const cached = redirectCache.get(cacheKey);
  if (cached) {
    if (Date.now() < cached.expires) {
      res.redirect(301, cached.to);
      return;
    }
    redirectCache.delete(cacheKey);
  }

  try {
    // Try last segment first
    let resolved = await resolveLegacySlug(lastSlug);

    // If not found, try middle segments (category fix)
    if (!resolved && segments.length >= 3) {
      // Try segment[1] as category
      const middleSlug = segments[1];
      const catResolved = await resolveLegacySlug(middleSlug);
      if (catResolved && catResolved.source === 'category') {
        // Rebuild path with cleaned category slug
        const newCatSegment = catResolved.newPath.split('/').pop()!.split('?')[0];
        const newSegments = [...segments];
        newSegments[1] = newCatSegment;
        resolved = { newPath: '/' + newSegments.join('/'), source: 'category' };
      }
    }

    if (!resolved) return next();

    redirectCache.set(cacheKey, { to: resolved.newPath, expires: Date.now() + CACHE_TTL_MS });
    res.redirect(301, resolved.newPath);
    return;
  } catch (err: any) {
    logger.warn(`[slugRedirect] Error for ${req.path}:`, err?.message);
    return next();
  }
};
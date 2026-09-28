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
import { RETIRED_URL_301 } from '../seo/retiredUrlMap';

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
  // Fast path: artifact-shaped slug -> go straight to the DB lookup.
  // Everything else is deferred to the 404 layer (see slugRedirectOnMiss below),
  // so a page that renders fine never pays a DB round trip.
  const fastPath = BAD_SLUG_RE.test(req.path);
  if (fastPath) {
    const r = await tryRedirect(req, res);
    if (r) return;
  }
  return next();
};

/** Shared resolver: 301s if the slug is a known legacy alias, else returns false. */
async function tryRedirect(req: Request, res: Response): Promise<boolean> {
  const segments = req.path.split('/').filter(Boolean);
  if (segments.length < 1) return false;

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
      return true;
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

    if (!resolved) return false;

    redirectCache.set(cacheKey, { to: resolved.newPath, expires: Date.now() + CACHE_TTL_MS });
    res.redirect(301, resolved.newPath);
    return true;
  } catch (err: any) {
    logger.warn(`[slugRedirect] Error for ${req.path}:`, err?.message);
    return false;
  }
}

/**
 * slugRedirectOnMiss — same resolver, but ONLY reached when the app has already
 * failed to serve the page (mounted just before notFound). This catches retired
 * product URLs that Google still ranks: 233 of the top 500 ranked pages were 404s
 * (4,946 impressions / 269 clicks a month landing on a dead end), because the
 * slug had been removed from the catalog with no redirect. Brand-new slugs are
 * unaffected — a page that renders never reaches this handler.
 */
export const slugRedirectOnMiss = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();
  if (looksLikeStaticAsset(req.path)) return next();
  try {
    const done = await tryRedirect(req, res);
    if (done) return;
  } catch (err: any) {
    logger.warn(`[slugRedirectOnMiss] Error for ${req.path}:`, err?.message);
  }
  return next();
};

/** Minimal local copy — server.ts's helper isn't exported from here. */
function looksLikeStaticAsset(p: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|mjs|map|json|xml|txt|woff2?|ttf|eot|mp4|webm|avif)$/i.test(p);
}

/**
 * resolveLegacyRedirect — the same lookup the middleware uses, but returns the
 * target path instead of writing the response, so the botRenderer's 404 branch can
 * rescue a retired product URL. Returns null when the slug is not a known alias.
 */
export async function resolveLegacyRedirect(pathname: string): Promise<string | null> {
  // 1. Decision-gated retired-URL map (fast O(1), no DB). Covers retired products
  //    in aisles we still sell, mapped to a verified inventory-backed subcategory.
  const normalised = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  const mapped = RETIRED_URL_301[normalised] || RETIRED_URL_301[pathname];
  if (mapped) return mapped;

  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) return null;
  const lastSlug = segments[segments.length - 1];
  const cacheKey = `${pathname}|${lastSlug}`;
  const cached = redirectCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) return cached.to;

  let resolved = await resolveLegacySlug(lastSlug);
  if (!resolved && segments.length >= 3) {
    const catResolved = await resolveLegacySlug(segments[1]);
    if (catResolved && catResolved.source === 'category') {
      const newCatSegment = catResolved.newPath.split('/').pop()!.split('?')[0];
      const newSegments = [...segments];
      newSegments[1] = newCatSegment;
      resolved = { newPath: '/' + newSegments.join('/'), source: 'category' };
    }
  }
  if (!resolved) return null;
  redirectCache.set(cacheKey, { to: resolved.newPath, expires: Date.now() + CACHE_TTL_MS });
  return resolved.newPath;
}

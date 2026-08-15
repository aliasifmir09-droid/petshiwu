import { getNeighborhoodRoute, neighborhoodLandingPath } from './neighborhoodRegistry';

export type RouteIndexingStatus = 'indexable' | 'noindex' | 'notFound' | 'redirect';

export type RouteClassification = {
  status: RouteIndexingStatus;
  indexable: boolean;
  canonicalPath: string;
  redirectTo?: string;
  routeType: string;
};

const PET_TYPES = new Set(['dog', 'cat', 'bird', 'fish', 'reptile', 'small-pet', 'small-animal', 'other-animals']);

// Real storefront pages with unique copy in App.tsx. These were previously
// noindexed by the doorway heuristic because the slug contains "food" / "nyc".
export const INDEXABLE_LANDING_PATHS = new Set([
  '/best-dog-food-sensitive-stomach-diarrhea',
  '/high-protein-dog-food-picky-eaters',
  '/durable-dog-toys-aggressive-chewers',
  '/pet-supplies-delivery-nyc',
  '/dog-food-delivery-nyc',
  '/cat-food-delivery-nyc',
  '/pet-store-queens-ny',
  '/online-pet-store-nyc',
  '/pet-supplies-near-me-nyc',
  '/affordable-pet-food-nyc',
  '/pet-food-delivery-nyc',
  '/raw-dog-food-nyc',
  '/organic-cat-food-nyc',
  '/luxury-pet-accessories-nyc',
  '/pet-supplies-queens-ny',
  '/pet-supplies-brooklyn-ny',
  '/pet-supplies-manhattan-ny',
  '/pet-supplies-bronx-ny',
  '/pet-supplies-staten-island-ny',
  '/pet-supplies-jackson-heights-ny',
  '/pet-supplies-williamsburg-brooklyn-ny',
  '/pet-supplies-park-slope-brooklyn-ny',
  '/pet-supplies-upper-west-side-nyc',
  '/pet-supplies-dumbo-brooklyn-ny',
  '/pet-supplies-long-island-city-queens-ny',
  '/pet-supplies-soho-nyc',
  '/pet-supplies-astoria-queens-ny',
]);

const INDEXABLE_ROOT_PATHS = new Set([
  '/', '/products', '/learning', '/care-guides', '/about', '/faq', '/returns',
  '/return-policy', '/donate', '/contact', '/shipping', '/shipping-policy', '/other-animals',
  '/privacy', '/privacy-policy', '/terms', '/terms-of-service', '/accessibility',
  '/shop', '/fish-tanks', '/press', '/investors', '/sell-with-us', '/vendors', '/partners',
  '/innovation',
  ...INDEXABLE_LANDING_PATHS,
]);

/** Canonical shop URLs Google should fetch. Aliases (/shop, /privacy-policy) stay out. */
export const CRAWLABLE_STOREFRONT_PATHS: string[] = [
  '/',
  '/products',
  '/dog',
  '/cat',
  '/bird',
  '/fish',
  '/reptile',
  '/small-animal',
  '/other-animals',
  '/learning',
  '/care-guides',
  '/about',
  '/faq',
  '/contact',
  '/press',
  '/returns',
  '/return-policy',
  '/shipping',
  '/privacy',
  '/terms',
  '/accessibility',
  '/donate',
  '/investors',
  '/sell-with-us',
  '/innovation',
  ...[...INDEXABLE_LANDING_PATHS].sort(),
];

export function canonicalPetSlug(slug: string): string {
  return slug === 'small-pet' ? 'small-animal' : slug;
}

const NOINDEX_ROOT_PATHS = new Set([
  '/search', '/checkout', '/cart', '/login', '/register', '/forgot-password',
  '/dashboard', '/driver', '/symptom-checker', '/deals', '/tech', '/scan', '/neural',
]);

const normalizePath = (rawPath: string): string => {
  let pathname = rawPath.split('?')[0] || '/';
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    // Keep the raw path. Malformed escaping is rejected below.
  }
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');
  return pathname || '/';
};

const isDoorwayRoot = (pathname: string): boolean => {
  const segment = pathname.slice(1);
  if (!segment || segment.includes('/')) return false;
  return /(?:delivery|supplies|food|litter|treats|toys|medication|vet|grooming|sitter|trainer|adoption|apartment|parks|nyc|queens|brooklyn|manhattan|bronx|staten-island|near-me)/i.test(segment);
};

export const classifyRoute = (rawPath: string): RouteClassification => {
  const canonicalPath = normalizePath(rawPath);
  const hasQuery = rawPath.includes('?');
  const hasWhitespace = /\s/.test(rawPath);
  const segments = canonicalPath.split('/').filter(Boolean);

  if (hasWhitespace || /\s/.test(canonicalPath)) {
    return { status: 'notFound', indexable: false, canonicalPath, routeType: 'malformed' };
  }

  if (canonicalPath === '/blog' || canonicalPath === '/blog/') {
    return { status: 'redirect', indexable: false, canonicalPath: '/learning', redirectTo: '/learning', routeType: 'legacy-blog' };
  }

  if (hasQuery) {
    return { status: 'noindex', indexable: false, canonicalPath, routeType: 'query-variant' };
  }

  if (INDEXABLE_LANDING_PATHS.has(canonicalPath)) {
    return { status: 'indexable', indexable: true, canonicalPath, routeType: 'landing' };
  }

  if (INDEXABLE_ROOT_PATHS.has(canonicalPath)) {
    return { status: 'indexable', indexable: true, canonicalPath, routeType: canonicalPath === '/' ? 'home' : 'static' };
  }

  if (NOINDEX_ROOT_PATHS.has(canonicalPath)) {
    return { status: 'noindex', indexable: false, canonicalPath, routeType: 'utility' };
  }

  // 1,400 thin neighborhood×category copies. 301 to the real city landing.
  const neighborhood = getNeighborhoodRoute(canonicalPath);
  if (neighborhood) {
    const redirectTo = neighborhoodLandingPath(neighborhood.categorySlug);
    return {
      status: 'redirect',
      indexable: false,
      canonicalPath: redirectTo,
      redirectTo,
      routeType: 'neighborhood-redirect',
    };
  }

  if (isDoorwayRoot(canonicalPath)) {
    return { status: 'noindex', indexable: false, canonicalPath, routeType: 'doorway' };
  }

  if (segments[0] === 'learning' && segments.length === 2 && segments[1]) {
    return { status: 'indexable', indexable: true, canonicalPath, routeType: 'learning' };
  }

  if (segments[0] === 'care-guides' && segments.length === 2 && segments[1]) {
    return { status: 'indexable', indexable: true, canonicalPath, routeType: 'care-guide' };
  }

  if (segments[0] === 'category' && segments.length === 2 && segments[1]) {
    return { status: 'indexable', indexable: true, canonicalPath, routeType: 'category' };
  }

  if (segments.length === 1 && PET_TYPES.has(segments[0])) {
    return { status: 'indexable', indexable: true, canonicalPath, routeType: 'pet-type' };
  }

  if (segments[0] === 'products' && segments.length === 2 && segments[1]) {
    return { status: 'noindex', indexable: false, canonicalPath, routeType: 'legacy-product' };
  }

  if (segments.length === 2 && PET_TYPES.has(segments[0]) && segments[1]) {
    return { status: 'indexable', indexable: true, canonicalPath, routeType: 'category' };
  }

  if (segments.length === 3 && PET_TYPES.has(segments[0]) && segments[1] && segments[2]) {
    return { status: 'indexable', indexable: true, canonicalPath, routeType: 'product' };
  }

  return { status: 'noindex', indexable: false, canonicalPath, routeType: 'unknown' };
};

export const isIndexableRoute = (path: string): boolean => classifyRoute(path).indexable;

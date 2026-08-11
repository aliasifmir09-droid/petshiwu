import { getNeighborhoodRoute } from './neighborhoodRegistry';

export type RouteIndexingStatus = 'indexable' | 'noindex' | 'notFound' | 'redirect';

export type RouteClassification = {
  status: RouteIndexingStatus;
  indexable: boolean;
  canonicalPath: string;
  redirectTo?: string;
  routeType: string;
};

const PET_TYPES = new Set(['dog', 'cat', 'bird', 'fish', 'reptile', 'small-pet', 'small-animal', 'other-animals']);

// These are the only root-level informational pages currently approved for
// indexing. SEO landing/matrix pages remain retained but noindex until each has
// independently verified content and browser/bot parity.
const INDEXABLE_ROOT_PATHS = new Set([
  '/', '/products', '/learning', '/care-guides', '/about', '/faq', '/returns',
  '/return-policy', '/donate', '/contact', '/shipping', '/shipping-policy', '/other-animals',
  '/privacy', '/privacy-policy', '/terms', '/terms-of-service', '/accessibility',
  '/shop', '/fish-tanks', '/press', '/investors', '/sell-with-us', '/vendors', '/partners',
]);

const NOINDEX_ROOT_PATHS = new Set([
  '/search', '/checkout', '/cart', '/login', '/register', '/forgot-password',
  '/dashboard', '/driver', '/symptom-checker', '/deals',
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

  if (INDEXABLE_ROOT_PATHS.has(canonicalPath)) {
    return { status: 'indexable', indexable: true, canonicalPath, routeType: canonicalPath === '/' ? 'home' : 'static' };
  }

  if (NOINDEX_ROOT_PATHS.has(canonicalPath)) {
    return { status: 'noindex', indexable: false, canonicalPath, routeType: 'utility' };
  }

  // Allowlist canonical neighborhood routes before the doorway heuristic.
  if (getNeighborhoodRoute(canonicalPath)) {
    return { status: 'indexable', indexable: true, canonicalPath, routeType: 'neighborhood' };
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

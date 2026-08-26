import { Product } from '@/types';
import { canonicalPetTypeSlug } from '@/utils/productPrice';

/** Check if a slug is valid - never allow undefined, null, or empty in URLs */
const isValidSlug = (val: unknown): val is string => {
  if (val == null || typeof val !== 'string') return false;
  const s = String(val).trim();
  if (s === '') return false;
  const lower = s.toLowerCase();
  return lower !== 'undefined' && lower !== 'null';
};

/**
 * Generates SEO-friendly product URL with category hierarchy
 * Format: /{petType}/{categoryPath}/{productSlug}
 * Example: /cat/dry-food/reveal-all-life-stages-wet-cat-food
 *
 * Never outputs "undefined" in URLs - invalid category slugs are skipped.
 */
export const generateProductUrl = (product: Product): string => {
  const productSlug = (product.slug || product._id || '').toString().trim();
  if (!productSlug) return '/products';

  // If no category or category is string, use simple URL
  if (!product.category || typeof product.category === 'string') {
    return `/products/${productSlug}`;
  }

  const category = product.category;
  const petType = canonicalPetTypeSlug(product.petType) || 'products';

  // Build category path from hierarchy - only include valid slugs
  const buildCategoryPath = (cat: typeof category): string[] => {
    const path: string[] = [];
    const buildPathRecursive = (current: typeof category | undefined, visited = new Set<string>()): void => {
      if (!current || path.length >= 3) return;
      const catId = current._id ? String(current._id) : '';
      if (catId && visited.has(catId)) return;
      if (catId) visited.add(catId);

      if (current.parentCategory && typeof current.parentCategory === 'object') {
        buildPathRecursive(current.parentCategory, visited);
      }

      if (isValidSlug(current.slug)) {
        path.push(String(current.slug).trim());
      }
    };
    buildPathRecursive(cat);
    return path;
  };

  const categoryPath = buildCategoryPath(category).filter(isValidSlug);
  const canonicalCategorySlug = categoryPath[categoryPath.length - 1];

  // Keep one canonical product path across browser routing, botRenderer, and
  // sitemap: use the immediate category slug, not parent/child variants.
  if (canonicalCategorySlug && isValidSlug(petType)) {
    return `/${petType}/${canonicalCategorySlug}/${productSlug}`;
  }

  return `/products/${productSlug}`;
};

/**
 * Extracts product slug from URL
 * Handles both old format (/products/slug) and new format (/petType/categoryPath/slug)
 */
export const extractProductSlugFromUrl = (urlPath: string): string => {
  // Remove leading slash and split
  const parts = urlPath.replace(/^\/+/, '').split('/');

  // If it starts with "products", the slug is the second part
  if (parts[0] === 'products' && parts.length >= 2) {
    return parts[1];
  }

  // Otherwise, the slug is the last part (for new format: /petType/categoryPath/slug)
  return parts[parts.length - 1] || '';
};

/**
 * Generates SEO-friendly category URL
 * Format: /{petType}/{categorySlug} (e.g., /dog/food)
 * Never outputs "undefined" - invalid slugs fall back to /products
 */
export const generateCategoryUrl = (categorySlug: string | undefined, petType?: string): string => {
  if (!isValidSlug(categorySlug)) return '/products';
  const slug = String(categorySlug).trim();

  const petSlug = canonicalPetTypeSlug(petType);
  if (isValidSlug(petSlug) && petSlug !== 'all' && petSlug !== 'other-animals') {
    return `/${petSlug}/${slug}`;
  }
  if (petType) {
    return `/category/${slug}?petType=${petType}`;
  }
  return `/category/${slug}`;
};


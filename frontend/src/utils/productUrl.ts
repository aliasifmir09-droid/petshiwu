import { Product } from '@/types';

/**
 * Generates SEO-friendly product URL with category hierarchy
 * Format: /{petType}/{categoryPath}/{productSlug}
 * Example: /cat/food-topper/reveal-all-life-stages-wet-cat-food
 * 
 * This function ensures consistent URLs for the same product regardless of
 * how the product data is structured, preventing duplicate links with different URLs.
 */
export const generateProductUrl = (product: Product): string => {
  // Normalize slug: ensure it's a string and trim any whitespace
  const productSlug = (product.slug || product._id || '').toString().trim();
  
  // If no category, use simple URL
  if (!product.category || typeof product.category === 'string') {
    return `/products/${productSlug}`;
  }

  const category = product.category;
  const petType = product.petType || 'products';
  
  // Build category path from hierarchy (from root to current category)
  const buildCategoryPath = (cat: typeof category): string[] => {
    const path: string[] = [];
    
    // Helper to recursively build path from root to current
    const buildPathRecursive = (current: typeof category | undefined, visited = new Set<string>()): void => {
      if (!current || path.length >= 3) return;
      
      const catId = current._id || '';
      if (visited.has(catId)) return; // Prevent circular references
      visited.add(catId);
      
      // If has parent, build parent path first
      if (current.parentCategory && typeof current.parentCategory === 'object') {
        buildPathRecursive(current.parentCategory, visited);
      }
      
      // Then add current category slug
      if (current.slug) {
        path.push(current.slug);
      }
    };
    
    buildPathRecursive(cat);
    return path;
  };

  const categoryPath = buildCategoryPath(category);
  
  // If we have category path, use SEO-friendly URL
  // Even if we only have one category level, still use the new format
  if (categoryPath.length > 0) {
    // Use petType if available, otherwise fallback to 'products'
    const validPetType = petType || 'products';
    return `/${validPetType}/${categoryPath.join('/')}/${productSlug}`;
  }
  
  // Fallback to simple URL if category path couldn't be built
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


const RECENTLY_VIEWED_KEY = 'recently_viewed_products';
const MAX_RECENTLY_VIEWED = 20; // Maximum number of recently viewed products to store

export interface RecentlyViewedProduct {
  productId: string;
  productSlug: string;
  productName: string;
  productImage?: string;
  viewedAt: number; // Timestamp
}

/**
 * Get all recently viewed products from localStorage
 */
export const getRecentlyViewed = (): RecentlyViewedProduct[] => {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!stored) return [];
    
    const products: RecentlyViewedProduct[] = JSON.parse(stored);
    // Sort by most recently viewed (newest first)
    return products.sort((a, b) => b.viewedAt - a.viewedAt);
  } catch (error) {
    console.error('Error reading recently viewed products:', error);
    return [];
  }
};

/**
 * Add a product to recently viewed
 */
export const addToRecentlyViewed = (product: {
  _id: string;
  slug: string;
  name: string;
  images?: string[];
}) => {
  try {
    const recentlyViewed = getRecentlyViewed();
    
    // Remove if already exists (to avoid duplicates)
    const filtered = recentlyViewed.filter(
      (item) => item.productId !== product._id
    );
    
    // Add new product at the beginning
    const newItem: RecentlyViewedProduct = {
      productId: product._id,
      productSlug: product.slug,
      productName: product.name,
      productImage: product.images?.[0],
      viewedAt: Date.now()
    };
    
    const updated = [newItem, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
    
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recently viewed product:', error);
  }
};

/**
 * Clear all recently viewed products
 */
export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch (error) {
    console.error('Error clearing recently viewed products:', error);
  }
};

/**
 * Remove a specific product from recently viewed
 */
export const removeFromRecentlyViewed = (productId: string) => {
  try {
    const recentlyViewed = getRecentlyViewed();
    const filtered = recentlyViewed.filter((item) => item.productId !== productId);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from recently viewed:', error);
  }
};

/**
 * Get recently viewed product IDs
 */
export const getRecentlyViewedIds = (): string[] => {
  return getRecentlyViewed().map((item) => item.productId);
};


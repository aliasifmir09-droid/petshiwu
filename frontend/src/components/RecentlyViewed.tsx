import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/products';
import { getRecentlyViewed } from '@/utils/recentlyViewed';
import ProductCard from './ProductCard';
import LoadingSpinner from './LoadingSpinner';
import { Clock, X } from 'lucide-react';
import { Product } from '@/types';

interface RecentlyViewedProps {
  limit?: number;
  showTitle?: boolean;
  showClearButton?: boolean;
}

const RecentlyViewed = ({ limit = 8, showTitle = true, showClearButton = false }: RecentlyViewedProps) => {
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  useEffect(() => {
    const items = getRecentlyViewed();
    const ids = items.slice(0, limit).map((item) => item.productId);
    setRecentlyViewedIds(ids);
  }, [limit]);

  // Fetch product details for recently viewed IDs
  const { data: products, isLoading } = useQuery({
    queryKey: ['recently-viewed-products', recentlyViewedIds],
    queryFn: async () => {
      if (recentlyViewedIds.length === 0) return [];
      
      // Fetch products by IDs
      const productPromises = recentlyViewedIds.map((id) =>
        productService.getProductById(id).catch(() => null)
      );
      
      const results = await Promise.all(productPromises);
      return results.filter((product): product is Product => product !== null);
    },
    enabled: recentlyViewedIds.length > 0,
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 10 * 60 * 1000 // Cache for 10 minutes
  });

  const handleClear = () => {
    localStorage.removeItem('recently_viewed_products');
    setRecentlyViewedIds([]);
  };

  if (!recentlyViewedIds.length) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="py-8">
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock size={28} className="text-primary-600" />
              <h2 className="text-3xl font-bold">Recently Viewed</h2>
            </div>
          </div>
        )}
        <LoadingSpinner />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock size={28} className="text-primary-600" />
            <h2 className="text-3xl font-bold">Recently Viewed</h2>
          </div>
          {showClearButton && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              <X size={16} />
              Clear History
            </button>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {products.map((product) => (
          <div key={product._id} className="flex">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;


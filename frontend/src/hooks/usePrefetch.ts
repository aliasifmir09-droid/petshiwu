import { useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/products';
import { reviewService } from '@/services/reviews';
import { recommendationService } from '@/services/recommendations';

/**
 * Hook for prefetching data that's likely to be needed next
 * Improves perceived performance by loading data before user navigates
 */
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  /**
   * Prefetch related products when viewing a product
   */
  const prefetchRelatedProducts = async (productId: string) => {
    try {
      // Prefetch recommendations
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['recommendations', productId],
          queryFn: () => recommendationService.getRecommendations(productId, 8),
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ['frequently-bought-together', productId],
          queryFn: () => recommendationService.getFrequentlyBoughtTogether(productId, 4),
          staleTime: 5 * 60 * 1000,
        }),
      ]);
    } catch (error) {
      // Silently fail - prefetching is optional
      console.debug('Prefetch failed:', error);
    }
  };

  /**
   * Prefetch product detail when hovering over product card
   */
  const prefetchProduct = async (slug: string) => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ['product', slug],
        queryFn: () => productService.getProduct(slug),
        staleTime: 2 * 60 * 1000,
      });
    } catch (error) {
      // Silently fail - prefetching is optional
      console.debug('Product prefetch failed:', error);
    }
  };

  /**
   * Prefetch category products when hovering over category link
   */
  const prefetchCategoryProducts = async (categoryId: string, petType?: string) => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ['products', 'category', categoryId, petType, 1, 'newest'],
        queryFn: () => productService.getProducts({
          page: 1,
          limit: 20,
          category: categoryId,
          petType: petType || undefined,
          sort: 'newest',
        }),
        staleTime: 30 * 1000,
      });
    } catch (error) {
      // Silently fail - prefetching is optional
      console.debug('Category products prefetch failed:', error);
    }
  };

  /**
   * Prefetch product reviews when viewing product detail
   */
  const prefetchProductReviews = async (productId: string) => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ['reviews', productId, 'newest'],
        queryFn: () => reviewService.getProductReviews(productId, 1, 10, undefined, 'newest'),
        staleTime: 1 * 60 * 1000,
      });
    } catch (error) {
      // Silently fail - prefetching is optional
      console.debug('Reviews prefetch failed:', error);
    }
  };

  return {
    prefetchRelatedProducts,
    prefetchProduct,
    prefetchCategoryProducts,
    prefetchProductReviews,
  };
};


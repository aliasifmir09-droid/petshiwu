import { useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { QUERY_CONFIG, UI } from '@/utils/dashboardConstants';

/**
 * Hook for prefetching dashboard data
 * PERFORMANCE FIX: Prefetch dashboard data on admin login for faster dashboard load
 */
export const useDashboardPrefetch = () => {
  const queryClient = useQueryClient();

  /**
   * Prefetch all dashboard data
   * Call this when admin logs in or navigates to dashboard
   */
  const prefetchDashboardData = async () => {
    try {
      await Promise.all([
        // Prefetch order stats
        queryClient.prefetchQuery({
          queryKey: ['orderStats'],
          queryFn: adminService.getOrderStats,
          staleTime: QUERY_CONFIG.ORDER_STATS_STALE_TIME,
          gcTime: QUERY_CONFIG.ORDER_STATS_GC_TIME,
        }),
        // Prefetch product stats
        queryClient.prefetchQuery({
          queryKey: ['productStats'],
          queryFn: adminService.getProductStats,
          staleTime: QUERY_CONFIG.PRODUCT_STATS_STALE_TIME,
          gcTime: QUERY_CONFIG.PRODUCT_STATS_GC_TIME,
        }),
        // Prefetch out-of-stock products (limited for performance)
        queryClient.prefetchQuery({
          queryKey: ['products', 'out-of-stock'],
          queryFn: () => adminService.getProducts({ inStock: false, limit: UI.OUT_OF_STOCK_FETCH_LIMIT }),
          staleTime: QUERY_CONFIG.OUT_OF_STOCK_STALE_TIME,
          gcTime: QUERY_CONFIG.OUT_OF_STOCK_GC_TIME,
        }),
        // Prefetch categories
        queryClient.prefetchQuery({
          queryKey: ['admin-categories'],
          queryFn: adminService.getAllCategoriesAdmin,
          staleTime: QUERY_CONFIG.CATEGORIES_STALE_TIME,
          gcTime: QUERY_CONFIG.CATEGORIES_GC_TIME,
        }),
        // Prefetch pet types
        queryClient.prefetchQuery({
          queryKey: ['pet-types'],
          queryFn: adminService.getPetTypes,
          staleTime: QUERY_CONFIG.PET_TYPES_STALE_TIME,
          gcTime: QUERY_CONFIG.PET_TYPES_GC_TIME,
        }),
      ]);
    } catch (error) {
      // Silently fail - prefetching is optional
      console.debug('Dashboard prefetch failed:', error);
    }
  };

  return { prefetchDashboardData };
};


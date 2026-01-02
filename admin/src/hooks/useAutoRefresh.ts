import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Dashboard query keys that should be invalidated when relevant data changes
 * This ensures the Dashboard UI stays in sync with data changes across the app
 */
const DASHBOARD_QUERY_KEYS = [
  'orderStats',
  'productStats',
  ['products', 'out-of-stock'],
  'admin-categories',
  'pet-types',
] as const;

/**
 * Determine which Dashboard queries should be invalidated based on the mutation query keys
 * This prevents unnecessary invalidations while ensuring Dashboard stays in sync
 */
const getDashboardQueriesToInvalidate = (mutationKeys: (string | string[])[]): (string | string[])[] => {
  const dashboardQueries: (string | string[])[] = [];
  
  // Check if any mutation key relates to orders
  const affectsOrders = mutationKeys.some(key => {
    const keyStr = Array.isArray(key) ? key[0] : key;
    return keyStr === 'orders' || keyStr === 'order';
  });
  
  // Check if any mutation key relates to products
  const affectsProducts = mutationKeys.some(key => {
    const keyStr = Array.isArray(key) ? key[0] : key;
    return keyStr === 'products' || keyStr === 'product';
  });
  
  // Check if any mutation key relates to categories
  const affectsCategories = mutationKeys.some(key => {
    const keyStr = Array.isArray(key) ? key[0] : key;
    return keyStr === 'categories' || keyStr === 'category' || keyStr === 'admin-categories';
  });
  
  // Check if any mutation key relates to pet types
  const affectsPetTypes = mutationKeys.some(key => {
    const keyStr = Array.isArray(key) ? key[0] : key;
    return keyStr === 'pet-types' || keyStr === 'petTypes' || keyStr === 'admin-pet-types';
  });
  
  // Invalidate relevant Dashboard queries
  if (affectsOrders) {
    dashboardQueries.push('orderStats');
  }
  
  if (affectsProducts) {
    dashboardQueries.push('productStats', ['products', 'out-of-stock']);
  }
  
  if (affectsCategories) {
    dashboardQueries.push('admin-categories');
    // Categories also affect product stats (products by category)
    if (!affectsProducts) {
      dashboardQueries.push('productStats');
    }
  }
  
  if (affectsPetTypes) {
    dashboardQueries.push('pet-types');
  }
  
  return dashboardQueries;
};

/**
 * Hook to automatically refresh queries after CRUD operations
 * This ensures that when you create/update/delete data, the current page
 * automatically shows the updated data without manual refresh
 * 
 * IMPORTANT: This hook now automatically invalidates Dashboard queries when relevant data changes
 * to keep the Dashboard UI in sync across the application.
 * 
 * @param queryKeys - Array of query keys to invalidate and refetch after mutation
 *                    Can be strings or arrays (e.g., ['products'] or ['products', '123'])
 * @param options - Optional configuration
 * @param options.invalidateDashboard - Whether to automatically invalidate Dashboard queries (default: true)
 * @returns Object with onSuccess callback to use in mutations
 * 
 * @example
 * // Simple usage - just specify the query keys
 * const { onMutationSuccess } = useAutoRefresh(['admin-pet-types', 'pet-types']);
 * 
 * const createMutation = useMutation({
 *   mutationFn: createPetType,
 *   onSuccess: onMutationSuccess('Pet type created successfully!', () => {
 *     handleCloseModal();
 *   })
 * });
 */
export const useAutoRefresh = (
  queryKeys: (string | string[])[] = [],
  options: {
    showToast?: (message: string, type: 'success' | 'error') => void;
    onComplete?: () => void;
    invalidateDashboard?: boolean; // New option to control Dashboard invalidation
  } = {}
) => {
  const queryClient = useQueryClient();
  const { showToast, onComplete: defaultOnComplete, invalidateDashboard = true } = options;

  /**
   * Callback to invalidate and refetch queries after successful mutation
   * @param successMessage - Optional success message to show via toast
   * @param onComplete - Optional callback to run after refresh (e.g., close modal)
   * @param additionalQueryKeys - Optional additional query keys to refresh
   */
  const onMutationSuccess = useCallback(
    (
      successMessage?: string,
      onComplete?: () => void,
      additionalQueryKeys?: (string | string[])[]
    ) => {
      return async () => {
        try {
          // Combine all query keys
          const allQueryKeys = [...queryKeys, ...(additionalQueryKeys || [])];
          
          // PERFORMANCE FIX: Automatically invalidate Dashboard queries when relevant data changes
          // This ensures the Dashboard UI stays in sync with data changes across the app
          let dashboardQueriesToInvalidate: (string | string[])[] = [];
          if (invalidateDashboard) {
            dashboardQueriesToInvalidate = getDashboardQueriesToInvalidate(allQueryKeys);
          }
          
          // Combine mutation query keys with Dashboard query keys
          const allKeysToInvalidate = [...allQueryKeys, ...dashboardQueriesToInvalidate];

          // Invalidate all specified query keys (including nested queries)
          await Promise.all(
            allKeysToInvalidate.map((key) => {
              const keyArray = Array.isArray(key) ? key : [key];
              return queryClient.invalidateQueries({
                queryKey: keyArray,
                exact: false, // Invalidate all queries that start with this key
              });
            })
          );

          // Refetch all specified query keys to immediately show updated data
          // Note: We only refetch the original mutation keys, not Dashboard keys
          // Dashboard will refetch automatically when it detects stale data
          await Promise.all(
            allQueryKeys.map((key) => {
              const keyArray = Array.isArray(key) ? key : [key];
              return queryClient.refetchQueries({
                queryKey: keyArray,
                exact: false, // Refetch all queries that start with this key
              });
            })
          );

          // Show success message if provided
          if (successMessage && showToast) {
            showToast(successMessage, 'success');
          }

          // Run completion callbacks (custom first, then default)
          if (onComplete) {
            onComplete();
          }
          if (defaultOnComplete) {
            defaultOnComplete();
          }
        } catch (error) {
          console.error('Error refreshing queries:', error);
          // Show error toast if provided
          if (showToast) {
            showToast('Failed to refresh data. Please reload the page.', 'error');
          }
          // Don't throw - we don't want to break the mutation success flow
        }
      };
    },
    [queryClient, queryKeys, showToast, defaultOnComplete]
  );

  /**
   * Callback for mutation errors
   * @param errorMessage - Optional error message to show via toast
   */
  const onMutationError = useCallback(
    (errorMessage?: string) => {
      return (error: any) => {
        const message =
          errorMessage ||
          error?.response?.data?.message ||
          error?.message ||
          'Operation failed. Please try again.';

        if (showToast) {
          showToast(message, 'error');
        }
      };
    },
    [showToast]
  );

  /**
   * Manually refresh queries (useful for custom scenarios)
   */
  const refreshQueries = useCallback(
    async (keysToRefresh?: (string | string[])[]) => {
      const keys = keysToRefresh || queryKeys;
      await Promise.all(
        keys.map((key) => {
          const keyArray = Array.isArray(key) ? key : [key];
          queryClient.invalidateQueries({ queryKey: keyArray, exact: false });
          return queryClient.refetchQueries({ queryKey: keyArray, exact: false });
        })
      );
    },
    [queryClient, queryKeys]
  );

  return {
    onMutationSuccess,
    onMutationError,
    refreshQueries,
  };
};


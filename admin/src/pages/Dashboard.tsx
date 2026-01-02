import { useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { useDashboardPrefetch } from '@/hooks/useDashboardPrefetch';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorMessage from '@/components/ErrorMessage';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsGrid from '@/components/dashboard/StatsGrid';
import InsightsCard from '@/components/dashboard/InsightsCard';
import { lazy, Suspense } from 'react';
import OutOfStockSection from '@/components/dashboard/OutOfStockSection';
import CategoryNavigationSection from '@/components/dashboard/CategoryNavigationSection';
import RecentOrdersTable from '@/components/dashboard/RecentOrdersTable';
// Lazy load chart components for better code splitting
const SalesChart = lazy(() => import('@/components/dashboard/SalesChart'));
const CategoryChart = lazy(() => import('@/components/dashboard/CategoryChart'));
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';
import { normalizeMonthName } from '@/utils/dateUtils';
import { QUERY_CONFIG, UI, MONTH_NAMES } from '@/utils/dashboardConstants';
import { validateOrderStats, validateProductStats, safeValidate } from '@/utils/dataValidation';
import { handleError, safeLogError } from '@/utils/errorHandling';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { exportOrderStats, exportProductStats } from '@/utils/exportUtils';

// TypeScript interfaces for type safety

interface RecentOrder {
  _id?: string;
  orderNumber?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  totalPrice?: number;
  orderStatus?: string;
  createdAt?: string | Date;
}

interface MonthlySale {
  month: string;
  sales: number;
  orderCount?: number;
}

interface OrderStats {
  totalOrders?: number;
  pendingOrders?: number;
  processingOrders?: number;
  shippedOrders?: number;
  deliveredOrders?: number;
  totalRevenue?: number;
  revenueTrend?: number;
  ordersTrend?: number;
  monthlySales?: MonthlySale[];
  recentOrders?: RecentOrder[];
}

interface ProductStats {
  totalProducts?: number;
  outOfStockProducts?: number;
  featuredProducts?: number;
  productsByCategory?: Array<{
    categoryName: string;
    count: number;
  }>;
}

interface Product {
  _id?: string;
  name?: string;
  brand?: string;
  images?: string[];
  totalStock?: number;
}

interface OutOfStockData {
  data?: Product[];
  pagination?: {
    total?: number;
  };
}


interface Category {
  _id?: string;
  name?: string;
  slug?: string;
  parentCategory?: string | Category | null;
  petType?: string;
  isActive?: boolean;
  subcategories?: Category[];
  level?: number;
}

interface PetType {
  _id?: string;
  name?: string;
  slug?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
}

interface CategoryGroup {
  petType: PetType;
  mainCategories: Category[];
  totalCategories: number;
  totalSubcategories: number;
}

// Export types for use in sub-components
export type { OrderStats, ProductStats, RecentOrder, MonthlySale, Product, OutOfStockData, Category, PetType, CategoryGroup };


const Dashboard = () => {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const { prefetchDashboardData } = useDashboardPrefetch();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // PERFORMANCE FIX: Prefetch dashboard data on mount if cache is empty
  useEffect(() => {
    const hasCachedData = queryClient.getQueryData(['orderStats']) || 
                         queryClient.getQueryData(['productStats']);
    if (!hasCachedData) {
      prefetchDashboardData().catch(() => {
        // Silently fail - prefetching is optional
      });
    }
  }, [queryClient, prefetchDashboardData]);
  
  // Date range filter for sales chart
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '3m' | '6m' | '1y'>('6m');
  
  
  // Comparison view toggle
  const [showComparison, setShowComparison] = useState(false);
  
  // Category chart view mode
  const [categoryViewMode, setCategoryViewMode] = useState<'subcategories' | 'products' | 'revenue'>('subcategories');
  
  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : false;
  });
  
  // Performance metrics (dev mode only)
  const { metrics } = usePerformanceMetrics(import.meta.env.DEV);
  
  // AbortController for query cancellation on unmount
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Stable reference helpers for memoization
  // Create stable hash from array for dependency tracking
  const getArrayHash = useCallback((arr: unknown[] | undefined): string => {
    if (!arr || !Array.isArray(arr)) return '';
    // Use length + first/last item IDs for quick comparison
    const firstId = (arr[0] as { _id?: string })?._id || '';
    const lastId = arr.length > 1 ? (arr[arr.length - 1] as { _id?: string })?._id || '' : '';
    return `${arr.length}-${firstId}-${lastId}`;
  }, []);
  
  // Get user data first
  // Only fetch if we're likely authenticated (skip if we know we're not)
  const { data: userData, isLoading: userDataLoading } = useQuery({
    queryKey: ['user-info'],
    queryFn: () => adminService.getMe(),
    retry: false, // Don't retry on 401 - it's expected if not authenticated
    staleTime: QUERY_CONFIG.USER_DATA_STALE_TIME,
  });

  const hasAnalyticsPermission = userData?.role === 'admin' || userData?.permissions?.canViewAnalytics;
  
  // Rate limiting for refresh - prevent abuse
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const REFRESH_COOLDOWN = 2000; // 2 seconds cooldown between refreshes

  // Handle manual refresh with error recovery and rate limiting
  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;

    // Rate limiting: prevent refresh if called too soon
    if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
      const remainingTime = Math.ceil((REFRESH_COOLDOWN - timeSinceLastRefresh) / 1000);
      showToast(`Please wait ${remainingTime} second${remainingTime > 1 ? 's' : ''} before refreshing again`, 'warning');
      return;
    }

    // Prevent multiple simultaneous refreshes
    if (isRefreshing) {
      return;
    }

    setLastRefreshTime(now);
    setIsRefreshing(true);
    try {
      // Invalidate and selectively refetch only dashboard-related queries
      // This prevents refetching all queries in the cache, improving performance
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orderStats'] }),
        queryClient.invalidateQueries({ queryKey: ['productStats'] }),
        queryClient.invalidateQueries({ queryKey: ['products', 'out-of-stock'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
        queryClient.invalidateQueries({ queryKey: ['pet-types'] }),
      ]);
      // Selectively refetch only the dashboard queries we invalidated
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['orderStats'] }),
        queryClient.refetchQueries({ queryKey: ['productStats'] }),
        queryClient.refetchQueries({ queryKey: ['products', 'out-of-stock'] }),
        queryClient.refetchQueries({ queryKey: ['admin-categories'] }),
        queryClient.refetchQueries({ queryKey: ['pet-types'] }),
      ]);
      setLastUpdated(new Date());
      showToast('Dashboard refreshed successfully', 'success');
    } catch (error) {
      const { userMessage } = handleError(error, 'Dashboard refresh');
      safeLogError(error, 'Dashboard refresh');
      showToast(userMessage, 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, showToast, lastRefreshTime, isRefreshing]);
  
  // Setup query cancellation on unmount
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    
    return () => {
      // Cancel all ongoing queries when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || 
          (e.target as HTMLElement)?.tagName === 'TEXTAREA' ||
          (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Ctrl/Cmd + R: Refresh dashboard
      if (ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (!isRefreshing) {
          handleRefresh();
        }
      }
      
      // Ctrl/Cmd + 1-4: Navigate to sections (scroll to)
      if (ctrlKey && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const sectionIndex = parseInt(e.key) - 1;
        const sections = ['stats', 'charts', 'out-of-stock', 'orders'];
        const sectionId = sections[sectionIndex];
        if (sectionId) {
          const element = document.getElementById(`dashboard-${sectionId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
      
      // Esc: Close any open modals/dropdowns (handled by individual components)
      if (e.key === 'Escape') {
        // This is a general handler - specific components handle their own Esc
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRefresh, isRefreshing]);

  const { data: orderStats, isLoading: orderStatsLoading, error: orderStatsError, dataUpdatedAt: orderStatsUpdatedAt } = useQuery({
    queryKey: ['orderStats'],
    queryFn: adminService.getOrderStats,
    enabled: hasAnalyticsPermission, // Only fetch if user has permission
    retry: 2, // Retry failed requests
    staleTime: QUERY_CONFIG.ORDER_STATS_STALE_TIME,
    gcTime: QUERY_CONFIG.ORDER_STATS_GC_TIME,
    refetchInterval: QUERY_CONFIG.ORDER_STATS_REFETCH_INTERVAL, // Now polls every 2 minutes instead of 20 seconds
    refetchOnWindowFocus: false, // Disabled - manual refresh button available if needed
  });
  
  // Update last updated timestamp when data changes
  useEffect(() => {
    if (orderStatsUpdatedAt) {
      setLastUpdated(new Date(orderStatsUpdatedAt));
    }
  }, [orderStatsUpdatedAt]);

  // Use useQueries for parallel fetching of independent queries
  // This ensures all queries start fetching simultaneously rather than sequentially
  const [
    productStatsQuery,
    outOfStockQuery,
    categoriesQuery,
    petTypesQuery
  ] = useQueries({
    queries: [
      {
        queryKey: ['productStats'],
        queryFn: adminService.getProductStats,
        enabled: hasAnalyticsPermission,
        retry: 2,
        staleTime: QUERY_CONFIG.PRODUCT_STATS_STALE_TIME,
        gcTime: QUERY_CONFIG.PRODUCT_STATS_GC_TIME,
        refetchOnWindowFocus: false, // Disabled - product stats don't need to refresh on window focus
      },
      {
        queryKey: ['products', 'out-of-stock'],
        queryFn: () => adminService.getProducts({ inStock: false, limit: UI.OUT_OF_STOCK_FETCH_LIMIT }),
        retry: 2,
        staleTime: QUERY_CONFIG.OUT_OF_STOCK_STALE_TIME,
        gcTime: QUERY_CONFIG.OUT_OF_STOCK_GC_TIME,
        refetchOnWindowFocus: false, // Disabled - out of stock doesn't need to refresh on window focus
      },
      {
        queryKey: ['admin-categories'],
        queryFn: adminService.getAllCategoriesAdmin,
        retry: 2,
        staleTime: QUERY_CONFIG.CATEGORIES_STALE_TIME,
        gcTime: QUERY_CONFIG.CATEGORIES_GC_TIME,
      },
      {
        queryKey: ['pet-types'],
        queryFn: adminService.getPetTypes,
        retry: 2,
        staleTime: QUERY_CONFIG.PET_TYPES_STALE_TIME,
        gcTime: QUERY_CONFIG.PET_TYPES_GC_TIME,
        refetchOnMount: true, // Always refetch when component mounts to get latest data
      },
    ],
  });

  // Extract and validate data from parallel queries
  // Memoize productStats to prevent unnecessary re-renders and count-up animations
  const productStats = useMemo(() => {
    return safeValidate<ProductStats>(productStatsQuery.data, validateProductStats);
  }, [
    productStatsQuery.data?.totalProducts,
    productStatsQuery.data?.outOfStockProducts,
    productStatsQuery.data?.featuredProducts,
    productStatsQuery.data?.productsByCategory,
  ]);
  const productStatsLoading = productStatsQuery.isLoading;
  const productStatsError = productStatsQuery.error;

  const outOfStockData = outOfStockQuery.data as OutOfStockData | undefined;
  const outOfStockLoading = outOfStockQuery.isLoading;
  const outOfStockError = outOfStockQuery.error;

  const categoriesData = categoriesQuery.data;
  const petTypesData = petTypesQuery.data;
  
  // Validate orderStats
  const validatedOrderStats = safeValidate<OrderStats>(orderStats, validateOrderStats);

  // Group categories by pet type - MEMOIZED for performance
  // Optimized: use stable references to prevent unnecessary recalculations
  const categoriesArray = categoriesData?.data;
  const petTypesArray = petTypesData?.data;
  
  // Create stable hash references for memoization dependencies
  const categoriesHash = useMemo(() => getArrayHash(categoriesArray as unknown[]), [categoriesArray, getArrayHash]);
  const petTypesHash = useMemo(() => getArrayHash(petTypesArray as unknown[]), [petTypesArray, getArrayHash]);
  
  const categoriesByPet = useMemo((): Record<string, CategoryGroup> => {
    if (!categoriesArray || !Array.isArray(categoriesArray) || !petTypesArray || !Array.isArray(petTypesArray)) {
      return {};
    }
    
    const grouped: Record<string, CategoryGroup> = {};
    const allCategories = categoriesArray as Category[];
    
    // Initialize with pet types
    (petTypesArray as PetType[]).forEach((petType: PetType) => {
      if (petType.slug) {
        grouped[petType.slug] = {
          petType: petType,
          mainCategories: [],
          totalCategories: 0,
          totalSubcategories: 0
        };
      }
    });

    // Group categories
    allCategories.forEach((category: Category) => {
      const petTypeSlug = category.petType || 'all';
      if (grouped[petTypeSlug]) {
        if (!category.parentCategory) {
          // Main category
          grouped[petTypeSlug].mainCategories.push(category);
          grouped[petTypeSlug].totalCategories++;
        } else {
          // Subcategory
          grouped[petTypeSlug].totalSubcategories++;
        }
      }
    });

    return grouped;
  }, [categoriesHash, petTypesHash, categoriesArray, petTypesArray]);

  // Check if user has permission issues
  const hasPermissionError = !hasAnalyticsPermission;

  // Calculate insights based on data
  const insights = useMemo(() => {
    const result: Array<{ type: 'success' | 'warning' | 'info' | 'error'; message: string }> = [];
    
    if (validatedOrderStats) {
      // Revenue trend insight
      if (validatedOrderStats.revenueTrend !== undefined && validatedOrderStats.revenueTrend > 0) {
        result.push({
          type: 'success',
          message: `Revenue is up ${Math.abs(validatedOrderStats.revenueTrend).toFixed(1)}% this month - great job! 🎉`,
        });
      } else if (validatedOrderStats.revenueTrend !== undefined && validatedOrderStats.revenueTrend < -10) {
        result.push({
          type: 'warning',
          message: `Revenue is down ${Math.abs(validatedOrderStats.revenueTrend).toFixed(1)}% this month. Consider running promotions.`,
        });
      }
      
      // Pending orders insight
      if (validatedOrderStats.pendingOrders && validatedOrderStats.pendingOrders > 5) {
        result.push({
          type: 'warning',
          message: `${validatedOrderStats.pendingOrders} orders are pending. Consider processing them soon.`,
        });
      }
    }
    
    // Out-of-stock insight
    if (outOfStockData?.data && outOfStockData.data.length > 0) {
      const count = outOfStockData.data.length;
      if (count >= 10) {
        result.push({
          type: 'error',
          message: `${count} products are out of stock. Urgent restocking needed!`,
        });
      } else if (count >= 3) {
        result.push({
          type: 'warning',
          message: `${count} products need restocking urgently.`,
        });
      }
    }
    
    return result;
  }, [validatedOrderStats, outOfStockData]);

  // Calculate real sales data from orderStats with date range filter
  // Optimized: depend on specific property instead of entire object to prevent unnecessary recalculations
  const monthlySales = validatedOrderStats?.monthlySales;
  
  // Calculate previous period data for comparison
  const previousPeriodSalesData = useMemo((): MonthlySale[] => {
    if (!monthlySales || !Array.isArray(monthlySales)) {
      return [];
    }
    
    const monthsToDisplay = dateRange === '7d' || dateRange === '30d' ? 1 : 
                           dateRange === '3m' ? 3 : 
                           dateRange === '6m' ? 6 : 12;
    
    // Get data for the period before the current one
    const previousRangeData = monthlySales.slice(-monthsToDisplay * 2, -monthsToDisplay);
    
    const now = new Date();
    const result: MonthlySale[] = [];
    
    for (let i = monthsToDisplay - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - monthsToDisplay - i, 1);
      const monthName = MONTH_NAMES[targetDate.getMonth()];
      const monthData = previousRangeData.find((m: MonthlySale) => {
        const normalizedBackendMonth = normalizeMonthName(m.month);
        return normalizedBackendMonth === monthName || m.month === monthName;
      });
      result.push({
        month: monthName,
        sales: monthData?.sales || 0
      });
    }
    
    return result;
  }, [monthlySales, dateRange]);
  const salesData = useMemo((): MonthlySale[] => {
    if (!monthlySales || !Array.isArray(monthlySales)) {
      // Return empty data structure if no data available
      const monthsToShow = dateRange === '7d' ? 1 : dateRange === '30d' ? 1 : dateRange === '3m' ? 3 : dateRange === '6m' ? 6 : 12;
      return Array.from({ length: monthsToShow }, (_, i) => {
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() - (monthsToShow - 1 - i));
        return { month: MONTH_NAMES[targetDate.getMonth()], sales: 0 };
      });
    }

    // Determine months to display based on date range
    let monthsToDisplay = 6;
    if (dateRange === '7d' || dateRange === '30d') {
      monthsToDisplay = 1; // Show current month for daily/weekly views
    } else if (dateRange === '3m') {
      monthsToDisplay = 3;
    } else if (dateRange === '6m') {
      monthsToDisplay = 6;
    } else if (dateRange === '1y') {
      monthsToDisplay = 12;
    }
    
    // Get data for the selected range
    const rangeData = monthlySales.slice(-monthsToDisplay);
    
    // If we have less than required months, pad with zeros
    const now = new Date();
    const result: MonthlySale[] = [];
    
    for (let i = monthsToDisplay - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = MONTH_NAMES[targetDate.getMonth()];
      // Use normalized month name for matching to handle various backend formats
      const monthData = rangeData.find((m: MonthlySale) => {
        const normalizedBackendMonth = normalizeMonthName(m.month);
        return normalizedBackendMonth === monthName || m.month === monthName;
      });
      result.push({
        month: monthName,
        sales: monthData?.sales || 0
      });
    }
    
    // Add previous period data if comparison is enabled
    if (showComparison && previousPeriodSalesData.length > 0) {
      return result.map((item, index) => ({
        ...item,
        previousSales: previousPeriodSalesData[index]?.sales || 0
      }));
    }
    
    return result;
  }, [monthlySales, dateRange, showComparison, previousPeriodSalesData]);

  // Calculate real trend values
  // Optimized: depend on specific properties instead of entire object to prevent unnecessary recalculations
  const revenueTrendValue = validatedOrderStats?.revenueTrend;
  const revenueTrend = useMemo(() => {
    if (revenueTrendValue === undefined || revenueTrendValue === null) {
      return null;
    }
    return {
      value: `${Math.abs(revenueTrendValue).toFixed(1)}% ${revenueTrendValue >= 0 ? 'increase' : 'decrease'} from last month`,
      isPositive: revenueTrendValue >= 0
    };
  }, [revenueTrendValue]);

  const ordersTrendValue = validatedOrderStats?.ordersTrend;
  const ordersTrend = useMemo(() => {
    if (ordersTrendValue === undefined || ordersTrendValue === null) {
      return null;
    }
    return {
      value: `${Math.abs(ordersTrendValue).toFixed(1)}% ${ordersTrendValue >= 0 ? 'increase' : 'decrease'} from last month`,
      isPositive: ordersTrendValue >= 0
    };
  }, [ordersTrendValue]);

  // Generate category data from actual navigation menu categories - MEMOIZED for performance
  // Added validation and error handling for category structure
  // Optimized: use stable hash reference to prevent unnecessary recalculations
  const categoryDataHash = useMemo(() => getArrayHash(categoriesArray as unknown[]), [categoriesArray, getArrayHash]);
  
  const categoryData = useMemo(() => {
    try {
      if (!categoriesArray || !Array.isArray(categoriesArray)) {
        // Fallback mock data if categories not loaded yet
        return [
          { name: 'Loading...', value: 0 }
        ];
      }

      // Validate and type categories array
      if (!Array.isArray(categoriesArray)) {
        return [{ name: 'No categories found', value: 0 }];
      }
      const rootCategories: Category[] = categoriesArray.filter((cat): cat is Category => 
        cat && typeof cat === 'object' && 'name' in cat
      );
      const categoryCounts: { [key: string]: number } = {};

      // Helper function to recursively count all subcategories at any level
      // Added validation to prevent crashes with unexpected data
      const countAllSubcategories = (category: Category): number => {
        try {
          // Validate category structure
          if (!category || typeof category !== 'object') {
            return 0;
          }
          
          if (!category.subcategories || !Array.isArray(category.subcategories) || category.subcategories.length === 0) {
            return 0;
          }
          
          let count = category.subcategories.length;
          // Also count nested subcategories (level 3) with validation
          category.subcategories.forEach((subcat: Category) => {
            try {
              if (subcat && typeof subcat === 'object' && subcat.subcategories && Array.isArray(subcat.subcategories)) {
                count += subcat.subcategories.length;
              }
            } catch (error) {
              // Silently skip invalid nested subcategories
              if (import.meta.env.DEV) {
                console.warn('Invalid nested subcategory structure:', error);
              }
            }
          });
          
          return count;
        } catch (error) {
          // Return 0 if counting fails
          if (import.meta.env.DEV) {
            console.warn('Error counting subcategories:', error);
          }
          return 0;
        }
      };

      // Process root categories (main categories, level 1) with validation
      // Early exit if we have enough data for display
      const maxCategoriesToProcess = UI.TOP_CATEGORIES_COUNT * 2; // Process 2x to ensure we have enough after filtering
      let processedCount = 0;
      
      rootCategories.forEach((category: Category) => {
        // Early exit optimization: stop processing if we have enough categories
        if (processedCount >= maxCategoriesToProcess && Object.keys(categoryCounts).length >= UI.TOP_CATEGORIES_COUNT) {
          return;
        }
        try {
          // Validate category structure before processing
          if (!category || typeof category !== 'object') {
            return; // Skip invalid categories
          }
          
          // Main categories are those without parentCategory (backend returns hierarchical structure)
          // So rootCategories array contains only main categories with their subcategories
          const isMainCategory = !category.parentCategory || 
                                category.parentCategory === null ||
                                (typeof category.parentCategory === 'object' && !category.parentCategory._id) ||
                                category.level === 1;

          if (isMainCategory) {
            // Validate category name exists
            const categoryName = category.name || 'Unnamed Category';
            
            // Determine pet type icon/prefix
            const petTypePrefix = category.petType === 'dog' ? '🐕 ' : 
                                 category.petType === 'cat' ? '🐱 ' : 
                                 category.petType === 'other-animals' ? '🐾 ' : '';
            const displayName = `${petTypePrefix}${categoryName}`;
            
            // Count based on view mode
            let value = 0;
            if (categoryViewMode === 'subcategories') {
              const subcategoryCount = countAllSubcategories(category);
              value = Math.max(subcategoryCount, 1);
            } else if (categoryViewMode === 'products') {
              // Use subcategory count as proxy for product count
              const subcategoryCount = countAllSubcategories(category);
              value = Math.max(subcategoryCount * 5, 1); // Estimate: ~5 products per subcategory
            } else {
              // Revenue mode - not implemented yet
              value = 0;
            }
            
            categoryCounts[displayName] = value;
            processedCount++;
          }
        } catch (error) {
          // Skip invalid categories and log in development
          if (import.meta.env.DEV) {
            console.warn('Error processing category:', error);
          }
        }
      });

      // Convert to array format for chart, sorted by value (descending)
      const chartData = Object.entries(categoryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, UI.TOP_CATEGORIES_COUNT);

      return chartData.length > 0 ? chartData : [
        { name: 'No categories found', value: 0 }
      ];
    } catch (error) {
      // Return safe fallback data if entire process fails
      if (import.meta.env.DEV) {
        console.error('Error generating category data:', error);
      }
      return [
        { name: 'Error loading categories', value: 0 }
      ];
    }
  }, [categoryDataHash, categoryViewMode, categoriesArray]);

  // Show loading state while checking permissions
  if (userDataLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading dashboard">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      );
    }

  return (
    <ErrorBoundary>
      {/* Skip links for keyboard navigation */}
      <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:z-50 focus-within:top-4 focus-within:left-4">
        <a
          href="#dashboard-stats"
          className="block bg-blue-600 text-white px-4 py-2 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Skip to Statistics
        </a>
        <a
          href="#dashboard-charts"
          className="block bg-blue-600 text-white px-4 py-2 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Skip to Charts
        </a>
        <a
          href="#dashboard-orders"
          className="block bg-blue-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Skip to Recent Orders
        </a>
      </div>
      <div className="space-y-8" role="main" aria-label="Dashboard overview">
        {/* Print Header */}
        <div className="print-header hidden print:block">
          <h1>Dashboard Report</h1>
          <div className="print-date">Generated: {new Date().toLocaleString()}</div>
        </div>
        
        <DashboardHeader
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
        
        {/* Performance Metrics (Dev Mode Only) */}
        {import.meta.env.DEV && metrics.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm no-print">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-yellow-800">Performance Metrics (Dev Mode)</h3>
              <button
                onClick={() => window.location.reload()}
                className="text-yellow-600 hover:text-yellow-800 underline"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {metrics.map((metric, index) => (
                <div key={index} className="text-yellow-700">
                  {metric.name}: {metric.duration.toFixed(2)}ms
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Permission Error Alert */}
      {hasPermissionError && (
        <ErrorMessage
          title="Limited Access"
          message="Your account doesn't have permission to view analytics and statistics. Please contact an administrator to grant you the 'canViewAnalytics' permission."
          variant="warning"
        />
      )}

      {/* Error Messages */}
      {orderStatsError && (
        <ErrorMessage
          title="Failed to load order statistics"
          message="Please refresh the page or try again later."
          variant="error"
        />
      )}

      {productStatsError && (
        <ErrorMessage
          title="Failed to load product statistics"
          message="Please refresh the page or try again later."
          variant="error"
        />
      )}

      <StatsGrid
        orderStats={validatedOrderStats}
        productStats={productStats}
        orderStatsLoading={orderStatsLoading}
        productStatsLoading={productStatsLoading}
        isRefreshing={isRefreshing}
        revenueTrend={revenueTrend}
        ordersTrend={ordersTrend}
        onExportOrderStats={() => {
          if (validatedOrderStats) {
            exportOrderStats(validatedOrderStats);
            showToast('Order statistics exported successfully', 'success');
          }
        }}
        onExportProductStats={() => {
          if (productStats) {
            exportProductStats(productStats);
            showToast('Product statistics exported successfully', 'success');
          }
        }}
      />

      {/* Analytics Insights */}
      {insights.length > 0 && (
        <InsightsCard insights={insights} />
      )}

      {/* Out of Stock Alert - Enhanced */}
      <OutOfStockSection
        outOfStockData={outOfStockData}
        outOfStockLoading={outOfStockLoading}
        outOfStockError={outOfStockError}
        onExportSuccess={(message: string) => showToast(message, 'success')}
      />

      {/* Charts - Enhanced */}
      <section id="dashboard-charts" aria-label="Sales and category charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 h-[400px] animate-pulse"><div className="h-full bg-gray-100 rounded"></div></div>}>
          <SalesChart
            salesData={salesData}
            previousPeriodSalesData={previousPeriodSalesData}
            orderStatsLoading={orderStatsLoading}
            orderStatsError={orderStatsError}
            showComparison={showComparison}
            dateRange={dateRange}
            onShowComparisonChange={setShowComparison}
            onDateRangeChange={setDateRange}
            onExportSuccess={(message: string) => showToast(message, 'success')}
          />
        </Suspense>
        <Suspense fallback={<div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 h-[400px] animate-pulse"><div className="h-full bg-gray-100 rounded"></div></div>}>
          <CategoryChart
            categoryData={categoryData}
            categoriesLoading={!categoriesData}
            categoryViewMode={categoryViewMode}
            onViewModeChange={setCategoryViewMode}
          />
        </Suspense>
      </section>

      {/* Navigation Menu Categories - New Section */}
      <CategoryNavigationSection
        categoriesByPet={categoriesByPet}
        categoriesLoading={!categoriesData}
        petTypesLoading={!petTypesData}
      />

      {/* Recent Orders - Enhanced */}
      <section id="dashboard-orders" aria-label="Recent orders">
        <RecentOrdersTable
        orderStats={validatedOrderStats}
        orderStatsLoading={orderStatsLoading}
        orderStatsError={orderStatsError}
        userRole={userData?.role}
        userPermissions={userData?.permissions}
        onExportSuccess={(message: string) => showToast(message, 'success')}
      />
      </section>
      
      {/* Toast Notification */}
      <Toast toast={toast} onClose={hideToast} />
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;




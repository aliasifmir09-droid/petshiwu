import { useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorMessage from '@/components/ErrorMessage';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsGrid from '@/components/dashboard/StatsGrid';
import InsightsCard from '@/components/dashboard/InsightsCard';
import HelpIcon from '@/components/dashboard/HelpIcon';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';
import { AlertTriangle, ExternalLink, FolderTree, ChevronRight, Inbox, Eye, Package, Download, ArrowUpDown, Search, Filter } from 'lucide-react';
import { normalizeImageUrl, getPlaceholderImage } from '@/utils/imageUtils';
import { formatDate, normalizeMonthName } from '@/utils/dateUtils';
import { QUERY_CONFIG, UI, MONTH_NAMES, CHART_MARGINS } from '@/utils/dashboardConstants';
import { validateOrderStats, validateProductStats, validateRecentOrder, safeValidate } from '@/utils/dataValidation';
import { maskCustomerName, canViewFullCustomerData } from '@/utils/privacyUtils';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { exportOrderStats, exportProductStats, exportRecentOrders, exportSalesData, exportOutOfStockProducts } from '@/utils/exportUtils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// TypeScript interfaces for type safety
interface OrderUser {
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface RecentOrder {
  _id?: string;
  orderNumber?: string;
  user?: OrderUser;
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

// Helper function to safely convert any ID to a unique string key
const getUniqueKey = (id: any, index: number, prefix: string = 'item'): string => {
  if (!id && id !== 0) {
    return `${prefix}-${index}`;
  }
  
  // Handle string IDs
  if (typeof id === 'string') {
    return `${id}-${index}`; // Add index to ensure uniqueness
  }
  
  // Handle number IDs
  if (typeof id === 'number') {
    return `${id}-${index}`;
  }
  
  // Handle object IDs (Mongoose ObjectId, etc.)
  if (typeof id === 'object') {
    // Try toString() method first (Mongoose ObjectId has this)
    if (id.toString && typeof id.toString === 'function') {
      try {
        const str = id.toString();
        if (str && str !== '[object Object]') {
          return `${str}-${index}`;
        }
      } catch (e) {
        // Fall through to other methods
      }
    }
    
    // Try valueOf() method
    if (id.valueOf && typeof id.valueOf === 'function') {
      try {
        const val = id.valueOf();
        if (val && val !== id) {
          return getUniqueKey(val, index, prefix);
        }
      } catch (e) {
        // Fall through
      }
    }
    
    // Last resort: JSON.stringify (but this might not work for circular refs)
    try {
      const json = JSON.stringify(id);
      if (json && json !== '{}' && json !== 'null') {
        return `${json}-${index}`;
      }
    } catch (e) {
      // Fall through to index-based key
    }
  }
  
  // Fallback: use index only
  return `${prefix}-${index}`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Date range filter for sales chart
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '3m' | '6m' | '1y'>('6m');
  
  // Out-of-stock sorting and filtering
  const [outOfStockSortBy, setOutOfStockSortBy] = useState<'name' | 'brand' | 'stock'>('name');
  const [outOfStockSortOrder, setOutOfStockSortOrder] = useState<'asc' | 'desc'>('asc');
  const [outOfStockSearch, setOutOfStockSearch] = useState('');
  
  // Recent orders filtering and sorting
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<string>('');
  const [ordersSortBy, setOrdersSortBy] = useState<'date' | 'total' | 'status'>('date');
  const [ordersSortOrder, setOrdersSortOrder] = useState<'asc' | 'desc'>('desc');
  const [ordersPage, setOrdersPage] = useState(1);
  const ordersPerPage = 5;
  
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
  const { metrics, addMetric } = usePerformanceMetrics(import.meta.env.DEV);
  
  // AbortController for query cancellation on unmount
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Get user data first
  // Only fetch if we're likely authenticated (skip if we know we're not)
  const { data: userData, isLoading: userDataLoading } = useQuery({
    queryKey: ['user-info'],
    queryFn: () => adminService.getMe(),
    retry: false, // Don't retry on 401 - it's expected if not authenticated
    staleTime: QUERY_CONFIG.USER_DATA_STALE_TIME,
  });

  const hasAnalyticsPermission = userData?.role === 'admin' || userData?.permissions?.canViewAnalytics;
  
  // Handle manual refresh with error recovery
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all dashboard-related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orderStats'] }),
        queryClient.invalidateQueries({ queryKey: ['productStats'] }),
        queryClient.invalidateQueries({ queryKey: ['products', 'out-of-stock'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
        queryClient.invalidateQueries({ queryKey: ['pet-types'] }),
      ]);
      // Refetch all queries
      await queryClient.refetchQueries();
      setLastUpdated(new Date());
      showToast('Dashboard refreshed successfully', 'success');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to refresh dashboard';
      console.error('Error refreshing data:', error);
      showToast(errorMessage, 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, showToast]);
  
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
    refetchInterval: QUERY_CONFIG.ORDER_STATS_REFETCH_INTERVAL,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
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
        refetchOnWindowFocus: true,
      },
      {
        queryKey: ['products', 'out-of-stock'],
        queryFn: () => adminService.getProducts({ inStock: false, limit: UI.OUT_OF_STOCK_FETCH_LIMIT }),
        retry: 2,
        staleTime: QUERY_CONFIG.OUT_OF_STOCK_STALE_TIME,
        gcTime: QUERY_CONFIG.OUT_OF_STOCK_GC_TIME,
        refetchOnWindowFocus: true,
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
      },
    ],
  });

  // Extract and validate data from parallel queries
  const productStats = safeValidate<ProductStats>(productStatsQuery.data, validateProductStats);
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
  }, [categoriesArray, petTypesArray]);

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
  // Optimized: use stable reference to prevent unnecessary recalculations
  const categoryData = useMemo(() => {
    try {
      if (!categoriesArray || !Array.isArray(categoriesArray)) {
        // Fallback mock data if categories not loaded yet
        return [
          { name: 'Loading...', value: 0 }
        ];
      }

      const rootCategories = categoriesArray; // Backend returns hierarchical structure (root categories with subcategories)
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
              // For now, use subcategory count as proxy for product count
              // TODO: Fetch actual product counts per category from backend
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
  }, [categoriesArray, categoryViewMode]);

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
      {outOfStockError && (
        <ErrorMessage
          title="Failed to load out-of-stock products"
          message="Please refresh the page or try again later."
          variant="warning"
        />
      )}

      {outOfStockLoading && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: UI.OUT_OF_STOCK_SKELETON_COUNT }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-14 h-14 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!outOfStockLoading && !outOfStockError && (
        <>
          {outOfStockData?.data && Array.isArray(outOfStockData.data) && outOfStockData.data.length > 0 ? (() => {
            // Filter and sort out-of-stock products
            const filteredProducts = (outOfStockData.data as Product[]).filter((product: Product) => {
              if (!outOfStockSearch) return true;
              const searchLower = outOfStockSearch.toLowerCase();
              return (
                product.name?.toLowerCase().includes(searchLower) ||
                product.brand?.toLowerCase().includes(searchLower)
              );
            });
            
            const sortedProducts = [...filteredProducts].sort((a, b) => {
              let comparison = 0;
              if (outOfStockSortBy === 'name') {
                comparison = (a.name || '').localeCompare(b.name || '');
              } else if (outOfStockSortBy === 'brand') {
                comparison = (a.brand || '').localeCompare(b.brand || '');
              } else if (outOfStockSortBy === 'stock') {
                comparison = (a.totalStock || 0) - (b.totalStock || 0);
              }
              return outOfStockSortOrder === 'asc' ? comparison : -comparison;
            });
            
            const displayedProducts = sortedProducts.slice(0, UI.OUT_OF_STOCK_DISPLAY_LIMIT);
            
            return (
        <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-l-4 border-red-600 rounded-xl p-6 shadow-xl animate-fade-in-up relative overflow-hidden">
          {/* Pulsing background effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 opacity-20 rounded-full blur-2xl animate-pulse-slow"></div>
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="flex-shrink-0 bg-red-100 p-3 rounded-full animate-pulse-slow">
              <AlertTriangle className="text-red-600" size={28} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-red-900">
                    ⚠️ Out of Stock Alert
                  </h3>
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse-slow">
                    {filteredProducts.length} Products
                  </span>
                </div>
                <button
                  onClick={() => {
                    exportOutOfStockProducts(outOfStockData.data as any[]);
                    showToast('Out-of-stock products exported successfully', 'success');
                  }}
                  className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                  title="Export to CSV"
                >
                  <Download size={16} />
                  Export
                </button>
              </div>
              <p className="text-red-800 mb-4 font-medium leading-relaxed">
                The following products are out of stock and cannot be purchased by customers. Please restock as soon as possible to avoid lost sales.
              </p>
              
              {/* Search and Sort Controls */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={outOfStockSearch}
                    onChange={(e) => setOutOfStockSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={outOfStockSortBy}
                    onChange={(e) => setOutOfStockSortBy(e.target.value as 'name' | 'brand' | 'stock')}
                    className="px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="brand">Sort by Brand</option>
                    <option value="stock">Sort by Stock</option>
                  </select>
                  <button
                    onClick={() => setOutOfStockSortOrder(outOfStockSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    title={`Sort ${outOfStockSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    <ArrowUpDown size={16} className={outOfStockSortOrder === 'desc' ? 'rotate-180' : ''} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {displayedProducts.map((product: Product, prodIndex: number) => (
                  <div key={getUniqueKey(product?._id, prodIndex, 'product')} className="flex items-center justify-between bg-white p-4 rounded-lg border-2 border-red-200 hover:border-red-400 transition-all hover-lift shadow-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={normalizeImageUrl(product.images?.[0]) || getPlaceholderImage(product.name || 'Product')}
                        alt={product.name || 'Product'}
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.src = getPlaceholderImage(product.name || 'Product');
                        }}
                        className="w-14 h-14 object-cover rounded-lg shadow-md"
                      />
                      <div>
                        <p className="font-bold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">{product.brand}</span> • Stock: <span className="text-red-600 font-bold">{product.totalStock}</span>
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/products"
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold text-sm transition-all transform hover:scale-105 shadow-md"
                    >
                      Restock
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                ))}
                {filteredProducts.length > UI.OUT_OF_STOCK_DISPLAY_LIMIT && (
                  <p className="text-sm text-red-800 font-semibold bg-red-100 px-4 py-2 rounded-lg inline-block">
                    + {filteredProducts.length - UI.OUT_OF_STOCK_DISPLAY_LIMIT} more products out of stock
                  </p>
                )}
                {outOfStockSearch && filteredProducts.length === 0 && (
                  <p className="text-sm text-red-600 font-medium text-center py-4">
                    No products found matching "{outOfStockSearch}"
                  </p>
                )}
              </div>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                View All Out of Stock Products
                <ExternalLink size={18} />
              </Link>
            </div>
          </div>
        </div>
            );
          })() : (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  <Package className="text-green-600" size={48} />
                </div>
                <p className="text-gray-700 font-semibold text-xl mb-2">All products are in stock!</p>
                <p className="text-gray-500 text-sm">Great job managing your inventory. No action needed.</p>
                <Link
                  to="/products"
                  className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                  View All Products
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* Charts - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all hover-lift animate-fade-in-up" role="region" aria-label="Sales overview chart">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-gray-900">Sales Overview</h2>
              <HelpIcon 
                content="This chart shows your sales revenue over time. Use the date range selector to view different periods. Enable comparison mode to compare with the previous period."
                position="right"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showComparison}
                  onChange={(e) => setShowComparison(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>Compare with previous period</span>
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '3m' | '6m' | '1y')}
                className="bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 rounded-lg text-sm font-bold text-blue-800 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                aria-label="Time period"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last Year</option>
              </select>
              <button
                onClick={() => {
                  exportSalesData(salesData);
                  showToast('Sales data exported successfully', 'success');
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                title="Export sales data to CSV"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
          {orderStatsLoading ? (
            <div className="h-[300px] animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-full bg-gray-100 rounded"></div>
            </div>
          ) : orderStatsError ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center text-red-600">
                <AlertTriangle className="mx-auto mb-2" size={32} />
                <p>Failed to load sales data</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={UI.CHART_HEIGHT} className="min-h-[250px] sm:min-h-[300px]">
              <LineChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#6b7280' }}
                  width={60}
                />
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => {
                    const currentValue = Number(value);
                    const previousValue = props.payload?.previousSales || 0;
                    const change = previousValue > 0 
                      ? ((currentValue - previousValue) / previousValue * 100).toFixed(1)
                      : null;
                    const totalSales = salesData.reduce((sum: number, item: any) => sum + item.sales, 0);
                    const percentageOfTotal = totalSales > 0
                      ? ((currentValue / totalSales) * 100).toFixed(1)
                      : null;
                    
                    let tooltipText = `$${currentValue.toFixed(2)}`;
                    if (change) {
                      const changeSymbol = Number(change) >= 0 ? '↑' : '↓';
                      tooltipText += `\n${changeSymbol} ${Math.abs(Number(change))}% vs previous period`;
                    }
                    if (percentageOfTotal) {
                      tooltipText += `\n${percentageOfTotal}% of total`;
                    }
                    
                    return [tooltipText, 'Sales'];
                  }}
                  contentStyle={{ 
                    fontSize: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    whiteSpace: 'pre-line'
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#0284c7" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Current Period"
                />
                {showComparison && previousPeriodSalesData.length > 0 && (
                  <Line 
                    type="monotone" 
                    dataKey="previousSales" 
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Previous Period"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all hover-lift animate-fade-in-up" role="region" aria-label="Category distribution chart">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-gray-900">Navigation Menu Categories</h2>
              <HelpIcon 
                content="This chart displays category distribution. Switch between subcategory count, product count, or revenue views using the dropdown."
                position="right"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={categoryViewMode}
                onChange={(e) => setCategoryViewMode(e.target.value as 'subcategories' | 'products' | 'revenue')}
                className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-lg text-sm font-bold text-green-800 border-0 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                aria-label="Category view mode"
              >
                <option value="subcategories">Subcategory Count</option>
                <option value="products">Product Count</option>
                <option value="revenue">Revenue (Coming Soon)</option>
              </select>
            </div>
          </div>
          {!categoriesData ? (
            <div className="h-[300px] animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-full bg-gray-100 rounded"></div>
            </div>
          ) : categoryData.length === 0 || (categoryData.length === 1 && categoryData[0].name === 'Loading...') ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-gray-500">No categories found</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={UI.CHART_HEIGHT} className="min-h-[250px] sm:min-h-[300px]">
              <BarChart data={categoryData} margin={{ top: CHART_MARGINS.TOP, right: CHART_MARGINS.RIGHT, left: CHART_MARGINS.LEFT, bottom: CHART_MARGINS.BOTTOM }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  style={{ fontSize: '11px', fontWeight: 'bold' }}
                  tick={{ fill: '#6b7280' }}
                  interval={0}
                />
                <YAxis 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#6b7280' }}
                  width={60}
                  label={{ 
                    value: categoryViewMode === 'subcategories' ? 'Subcategories' : 
                           categoryViewMode === 'products' ? 'Products' : 'Revenue', 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { fontSize: '11px' } 
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #3b82f6', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any) => {
                    const label = categoryViewMode === 'subcategories' ? 'subcategories' : 
                                 categoryViewMode === 'products' ? 'products' : 'revenue';
                    return [`${value} ${label}`, 'Count'];
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="url(#colorGradient)" 
                  radius={[8, 8, 0, 0]}
                  label={{ position: 'top', formatter: (value: any) => `${value}` }}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Navigation Menu Categories - New Section */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl shadow-xl border-2 border-indigo-200 hover:shadow-2xl transition-all animate-fade-in-up overflow-hidden">
        <div className="p-6 border-b border-indigo-200 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <FolderTree className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Navigation Menu Categories</h2>
                <p className="text-indigo-100 text-sm mt-1">Categories visible in the website navigation menu</p>
              </div>
            </div>
            <Link
              to="/categories"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              Manage Categories
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>

        <div className="p-6">
          {!categoriesData || !petTypesData ? (
            <div className="text-center py-8 text-gray-500">Loading navigation menu structure...</div>
          ) : Object.keys(categoriesByPet).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium mb-2">No categories configured</p>
              <Link
                to="/categories"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Create your first category
                <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(categoriesByPet).map(([petTypeSlug, data]: [string, CategoryGroup]) => (
                <div
                  key={petTypeSlug}
                  className="bg-white rounded-xl p-5 border-2 border-indigo-100 hover:border-indigo-300 transition-all hover-lift shadow-md"
                >
                  {/* Pet Type Header */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                    <div className="text-4xl">{data.petType.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-gray-900">{data.petType.name}</h3>
                      <p className="text-sm text-gray-600">{data.petType.description || 'Pet type category'}</p>
                    </div>
                    {data.petType.isActive ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="text-blue-600 text-xs font-semibold uppercase">Main Categories</div>
                      <div className="text-2xl font-black text-blue-900 mt-1">{data.mainCategories.length}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <div className="text-purple-600 text-xs font-semibold uppercase">Subcategories</div>
                      <div className="text-2xl font-black text-purple-900 mt-1">{data.totalSubcategories}</div>
                    </div>
                  </div>

                  {/* Categories List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.mainCategories.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No main categories yet</p>
                    ) : (
                      data.mainCategories.map((category: Category, catIndex: number) => (
                        <Link
                          key={getUniqueKey(category?._id, catIndex, 'category')}
                          to="/categories"
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">
                              {category.name}
                            </span>
                          </div>
                          {!category.isActive && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                              Inactive
                            </span>
                          )}
                        </Link>
                      ))
                    )}
                  </div>

                  {/* View All Link */}
                  {data && data.mainCategories && data.mainCategories.length > 0 && (
                    <Link
                      to={`/categories?petType=${petTypeSlug}`}
                      className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold w-full justify-center py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      View All Categories
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders - Enhanced */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all animate-fade-in-up" role="region" aria-label="Recent orders">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-gray-900">Recent Orders</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const orders = validatedOrderStats?.recentOrders || [];
                  if (orders.length > 0) {
                    exportRecentOrders(orders as any[]);
                    showToast('Orders exported successfully', 'success');
                  }
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                title="Export recent orders to CSV"
              >
                <Download size={16} />
                Export
              </button>
              <Link
                to="/orders"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm"
              >
                View All
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          
          {/* Filters and Sorting */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={ordersStatusFilter}
                onChange={(e) => {
                  setOrdersStatusFilter(e.target.value);
                  setOrdersPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-gray-500" />
              <select
                value={ordersSortBy}
                onChange={(e) => setOrdersSortBy(e.target.value as 'date' | 'total' | 'status')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="date">Sort by Date</option>
                <option value="total">Sort by Total</option>
                <option value="status">Sort by Status</option>
              </select>
              <button
                onClick={() => setOrdersSortOrder(ordersSortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title={`Sort ${ordersSortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <ArrowUpDown size={16} className={ordersSortOrder === 'desc' ? 'rotate-180' : ''} />
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Recent orders table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" scope="col">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" scope="col">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" scope="col">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" scope="col">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" scope="col">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orderStatsLoading ? (
                // Skeleton loaders for table rows
                <>
                  {Array.from({ length: UI.RECENT_ORDERS_SKELETON_COUNT }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : orderStatsError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-red-600">
                    Failed to load recent orders. Please refresh the page.
                  </td>
                </tr>
              ) : (() => {
                const orderStatsData = validatedOrderStats;
                const recentOrders = orderStatsData?.recentOrders;
                if (recentOrders && Array.isArray(recentOrders) && recentOrders.length > 0) {
                  // Filter and validate orders
                  let validOrders = recentOrders.filter(validateRecentOrder);
                  
                  // Apply status filter
                  if (ordersStatusFilter) {
                    validOrders = validOrders.filter((order: RecentOrder) => 
                      order.orderStatus?.toLowerCase() === ordersStatusFilter.toLowerCase()
                    );
                  }
                  
                  // Sort orders
                  validOrders = [...validOrders].sort((a, b) => {
                    let comparison = 0;
                    if (ordersSortBy === 'date') {
                      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                      comparison = dateA - dateB;
                    } else if (ordersSortBy === 'total') {
                      comparison = (a.totalPrice ?? 0) - (b.totalPrice ?? 0);
                    } else if (ordersSortBy === 'status') {
                      comparison = (a.orderStatus || '').localeCompare(b.orderStatus || '');
                    }
                    return ordersSortOrder === 'asc' ? comparison : -comparison;
                  });
                  
                  // Paginate orders
                  const totalPages = Math.ceil(validOrders.length / ordersPerPage);
                  const startIndex = (ordersPage - 1) * ordersPerPage;
                  const paginatedOrders = validOrders.slice(startIndex, startIndex + ordersPerPage);
                  
                  return (
                    <>
                      {paginatedOrders.map((order: RecentOrder, index: number) => {
                    if (!order) return null;
                    const orderId = order._id || order.orderNumber || '';
                    
                    // Privacy: Mask customer names based on permissions
                    const canViewFullData = canViewFullCustomerData(userData?.role, userData?.permissions);
                    const customerName = canViewFullData
                      ? `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Guest'
                      : maskCustomerName(order.user?.firstName, order.user?.lastName);
                    
                    return (
                      <tr 
                        key={getUniqueKey(order?._id, index, 'order')} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          if (orderId) {
                            navigate(`/orders?orderId=${orderId}`);
                          }
                        }}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && orderId) {
                            e.preventDefault();
                            navigate(`/orders?orderId=${orderId}`);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for order ${order.orderNumber || orderId}`}
                      >
                        <td className="px-6 py-4 text-sm font-medium">{order.orderNumber || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm" title={canViewFullData ? undefined : 'Customer name masked for privacy'}>
                          {customerName}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          ${(order.totalPrice ?? 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.orderStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`} aria-label={`Order status: ${order.orderStatus || 'Unknown'}`}>
                            {order.orderStatus || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link
                            to={`/orders${orderId ? `?orderId=${orderId}` : ''}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`View details for order ${order.orderNumber || orderId}`}
                          >
                            <Eye size={16} aria-hidden="true" />
                            <span>View</span>
                          </Link>
                        </td>
                      </tr>
                      );
                      })}
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600">
                                Showing {startIndex + 1} to {Math.min(startIndex + ordersPerPage, validOrders.length)} of {validOrders.length} orders
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setOrdersPage(prev => Math.max(1, prev - 1))}
                                  disabled={ordersPage === 1}
                                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                  Previous
                                </button>
                                <span className="text-sm text-gray-600">
                                  Page {ordersPage} of {totalPages}
                                </span>
                                <button
                                  onClick={() => setOrdersPage(prev => Math.min(totalPages, prev + 1))}
                                  disabled={ordersPage === totalPages}
                                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                }
                return (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Inbox className="text-gray-400 mb-3" size={48} />
                        <p className="text-gray-500 font-medium text-lg">No recent orders</p>
                        <p className="text-gray-400 text-sm mt-1">Orders will appear here once customers start placing them</p>
                        <Link
                          to="/orders"
                          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm"
                        >
                          View All Orders
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Toast Notification */}
      <Toast toast={toast} onClose={hideToast} />
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;




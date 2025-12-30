import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import StatCard from '@/components/StatCard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { DollarSign, Package, ShoppingCart, TrendingUp, AlertTriangle, ExternalLink, FolderTree, ChevronRight, Inbox, Eye } from 'lucide-react';
import { normalizeImageUrl, handleImageError } from '@/utils/imageUtils';
import { formatDate } from '@/utils/dateUtils';
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
  
  // Get user data first
  // Only fetch if we're likely authenticated (skip if we know we're not)
  const { data: userData, isLoading: userDataLoading } = useQuery({
    queryKey: ['user-info'],
    queryFn: () => adminService.getMe(),
    retry: false, // Don't retry on 401 - it's expected if not authenticated
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const hasAnalyticsPermission = userData?.role === 'admin' || userData?.permissions?.canViewAnalytics;

  const { data: orderStats, isLoading: orderStatsLoading, error: orderStatsError } = useQuery({
    queryKey: ['orderStats'],
    queryFn: adminService.getOrderStats,
    enabled: hasAnalyticsPermission, // Only fetch if user has permission
    retry: 2, // Retry failed requests
    staleTime: 30 * 1000, // Cache for 30 seconds (reduced for faster updates)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 20000, // Poll every 20 seconds for new orders (fallback if SSE fails)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  const { data: productStats, isLoading: productStatsLoading, error: productStatsError } = useQuery<ProductStats>({
    queryKey: ['productStats'],
    queryFn: adminService.getProductStats,
    enabled: hasAnalyticsPermission, // Only fetch if user has permission
    retry: 2, // Retry failed requests
    staleTime: 10 * 1000, // Cache for 10 seconds (reduced from 2 minutes for faster updates)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Get out-of-stock products - limited to 10 for performance
  const { data: outOfStockData, isLoading: outOfStockLoading, error: outOfStockError } = useQuery<OutOfStockData>({
    queryKey: ['products', 'out-of-stock'],
    queryFn: () => adminService.getProducts({ inStock: false, limit: 10 }),
    retry: 2, // Retry failed requests
    staleTime: 10 * 1000, // Cache for 10 seconds (reduced from 2 minutes for faster updates)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Get categories and pet types for navigation menu
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminService.getAllCategoriesAdmin,
    retry: 2, // Retry failed requests
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const { data: petTypesData } = useQuery({
    queryKey: ['pet-types'],
    queryFn: adminService.getPetTypes,
    retry: 2, // Retry failed requests
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Group categories by pet type - MEMOIZED for performance
  const categoriesByPet = useMemo((): Record<string, CategoryGroup> => {
    if (!categoriesData?.data || !petTypesData?.data) return {};
    
    const grouped: Record<string, CategoryGroup> = {};
    const allCategories = categoriesData.data as Category[];
    
    // Initialize with pet types
    (petTypesData.data as PetType[]).forEach((petType: PetType) => {
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
  }, [categoriesData?.data, petTypesData?.data]);

  // Check if user has permission issues
  const hasPermissionError = !hasAnalyticsPermission;

  // Calculate real sales data from orderStats
  const salesData = useMemo((): MonthlySale[] => {
    const orderStatsData = orderStats as OrderStats | undefined;
    if (!orderStatsData?.monthlySales || !Array.isArray(orderStatsData.monthlySales)) {
      // Return empty data structure if no data available
      return [
        { month: 'Jan', sales: 0 },
        { month: 'Feb', sales: 0 },
        { month: 'Mar', sales: 0 },
        { month: 'Apr', sales: 0 },
        { month: 'May', sales: 0 },
        { month: 'Jun', sales: 0 }
      ];
    }

    // Get last 6 months of data
    const last6Months = orderStatsData.monthlySales.slice(-6);
    
    // If we have less than 6 months, pad with zeros
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result: MonthlySale[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[targetDate.getMonth()];
      const monthData = last6Months.find((m: MonthlySale) => m.month === monthName);
      result.push({
        month: monthName,
        sales: monthData?.sales || 0
      });
    }
    
    return result;
  }, [orderStats]);

  // Calculate real trend values
  const revenueTrend = useMemo(() => {
    const orderStatsData = orderStats as OrderStats | undefined;
    if (orderStatsData?.revenueTrend === undefined || orderStatsData.revenueTrend === null) {
      return null;
    }
    const trend = orderStatsData.revenueTrend;
    return {
      value: `${Math.abs(trend).toFixed(1)}% ${trend >= 0 ? 'increase' : 'decrease'} from last month`,
      isPositive: trend >= 0
    };
  }, [orderStats]);

  const ordersTrend = useMemo(() => {
    const orderStatsData = orderStats as OrderStats | undefined;
    if (orderStatsData?.ordersTrend === undefined || orderStatsData.ordersTrend === null) {
      return null;
    }
    const trend = orderStatsData.ordersTrend;
    return {
      value: `${Math.abs(trend).toFixed(1)}% ${trend >= 0 ? 'increase' : 'decrease'} from last month`,
      isPositive: trend >= 0
    };
  }, [orderStats]);

  // Generate category data from actual navigation menu categories - MEMOIZED for performance
  // Added validation and error handling for category structure
  const categoryData = useMemo(() => {
    try {
      if (!categoriesData?.data || !Array.isArray(categoriesData.data)) {
        // Fallback mock data if categories not loaded yet
        return [
          { name: 'Loading...', value: 0 }
        ];
      }

      const rootCategories = categoriesData.data; // Backend returns hierarchical structure (root categories with subcategories)
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
      rootCategories.forEach((category: any) => {
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
            
            // Count subcategories for this main category with error handling
            const subcategoryCount = countAllSubcategories(category);
            
            // Use subcategory count as value, or default to 1 if no subcategories
            categoryCounts[displayName] = Math.max(subcategoryCount, 1);
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
        .slice(0, 15); // Top 15 categories

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
  }, [categoriesData?.data]);

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
        {/* Header Section with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-xl">
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-white mb-2 animate-fade-in-up">
              Dashboard Overview
            </h1>
            <p className="text-blue-100 text-lg animate-fade-in-up">
              Welcome back! Here's what's happening with your store today.
            </p>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300 opacity-10 rounded-full blur-3xl"></div>
        </div>

      {/* Permission Error Alert */}
      {hasPermissionError && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-xl p-6 shadow-lg animate-fade-in-up" role="alert" aria-live="polite">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-full" aria-hidden="true">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-yellow-900 mb-2">
                Limited Access
              </h3>
              <p className="text-yellow-700 leading-relaxed">
                Your account doesn't have permission to view analytics and statistics. 
                Please contact an administrator to grant you the <strong>"canViewAnalytics"</strong> permission.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {orderStatsError && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 shadow-lg" role="alert" aria-live="polite">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={20} aria-hidden="true" />
            <div>
              <h3 className="text-red-800 font-semibold">Failed to load order statistics</h3>
              <p className="text-red-600 text-sm">Please refresh the page or try again later.</p>
            </div>
          </div>
        </div>
      )}

      {productStatsError && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 shadow-lg" role="alert" aria-live="polite">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={20} aria-hidden="true" />
            <div>
              <h3 className="text-red-800 font-semibold">Failed to load product statistics</h3>
              <p className="text-red-600 text-sm">Please refresh the page or try again later.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid with Staggered Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-animation" role="region" aria-label="Statistics overview">
        {orderStatsLoading || productStatsLoading ? (
          // Skeleton loaders for stats cards
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-32 mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-40"></div>
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={`$${(orderStats?.totalRevenue ?? 0).toFixed(2)}`}
              icon={DollarSign}
              color="green"
              trend={revenueTrend || undefined}
            />
            <StatCard
              title="Total Orders"
              value={orderStats?.totalOrders ?? 0}
              icon={ShoppingCart}
              color="blue"
              trend={ordersTrend || undefined}
            />
            <StatCard
              title="Total Products"
              value={(productStats as ProductStats | undefined)?.totalProducts ?? 0}
              icon={Package}
              color="yellow"
            />
            <StatCard
              title="Pending Orders"
              value={orderStats?.pendingOrders ?? 0}
              icon={TrendingUp}
              color="red"
            />
          </>
        )}
      </div>

      {/* Out of Stock Alert - Enhanced */}
      {outOfStockError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-600" size={20} />
            <div>
              <h3 className="text-yellow-800 font-semibold">Failed to load out-of-stock products</h3>
              <p className="text-yellow-600 text-sm">Please refresh the page or try again later.</p>
            </div>
          </div>
        </div>
      )}

      {outOfStockLoading && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
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
          {outOfStockData?.data && Array.isArray(outOfStockData.data) && outOfStockData.data.length > 0 ? (
        <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-l-4 border-red-600 rounded-xl p-6 shadow-xl animate-fade-in-up relative overflow-hidden">
          {/* Pulsing background effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 opacity-20 rounded-full blur-2xl animate-pulse-slow"></div>
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="flex-shrink-0 bg-red-100 p-3 rounded-full animate-pulse-slow">
              <AlertTriangle className="text-red-600" size={28} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-2xl font-black text-red-900">
                  ⚠️ Out of Stock Alert
                </h3>
                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse-slow">
                  {outOfStockData.data.length} Products
                </span>
              </div>
              <p className="text-red-800 mb-4 font-medium leading-relaxed">
                The following products are out of stock and cannot be purchased by customers. Please restock as soon as possible to avoid lost sales.
              </p>
              <div className="space-y-2 mb-4">
                {(outOfStockData.data as Product[]).slice(0, 5).map((product: Product, prodIndex: number) => (
                  <div key={getUniqueKey(product?._id, prodIndex, 'product')} className="flex items-center justify-between bg-white p-4 rounded-lg border-2 border-red-200 hover:border-red-400 transition-all hover-lift shadow-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={normalizeImageUrl(product.images?.[0])}
                        alt={product.name}
                        onError={(e) => handleImageError(e, product.name)}
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
                {outOfStockData.data.length > 5 && (
                  <p className="text-sm text-red-800 font-semibold bg-red-100 px-4 py-2 rounded-lg inline-block">
                    + {outOfStockData.data.length - 5} more products out of stock
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
          ) : (
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
            <h2 className="text-2xl font-black text-gray-900">Sales Overview</h2>
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 rounded-lg" aria-label="Time period">
              <p className="text-sm font-bold text-blue-800">Last 6 Months</p>
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
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Sales']} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#0284c7" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all hover-lift animate-fade-in-up" role="region" aria-label="Category distribution chart">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900">Navigation Menu Categories</h2>
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-lg" aria-label="Chart description">
              <p className="text-sm font-bold text-green-800">Main Categories by Pet Type</p>
            </div>
          </div>
          {!categoriesData ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p>Loading categories...</p>
              </div>
            </div>
          ) : categoryData.length === 0 || (categoryData.length === 1 && categoryData[0].name === 'Loading...') ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-gray-500">No categories found</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  style={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <YAxis 
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Subcategories', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #3b82f6', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any) => [`${value} subcategories`, 'Count']}
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
                  {data.mainCategories.length > 0 && (
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
          <h2 className="text-2xl font-black text-gray-900">Recent Orders</h2>
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
                  {[1, 2, 3, 4, 5].map((i) => (
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
                const orderStatsData = orderStats as OrderStats | undefined;
                const recentOrders = orderStatsData?.recentOrders;
                if (recentOrders && Array.isArray(recentOrders) && recentOrders.length > 0) {
                  return recentOrders.map((order: RecentOrder, index: number) => {
                    if (!order) return null;
                    const orderId = order._id || order.orderNumber || '';
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
                        <td className="px-6 py-4 text-sm">
                          {order.user?.firstName || ''} {order.user?.lastName || ''}
                          {!order.user?.firstName && !order.user?.lastName && 'Guest'}
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
                  });
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
    </ErrorBoundary>
  );
};

export default Dashboard;




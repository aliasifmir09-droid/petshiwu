import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import StatCard from '@/components/StatCard';
import { DollarSign, Package, ShoppingCart, TrendingUp, AlertTriangle, ExternalLink, FolderTree, ChevronRight } from 'lucide-react';
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

const Dashboard = () => {
  // Get user data first
  const { data: userData } = useQuery({
    queryKey: ['user-info'],
    queryFn: () => adminService.getMe()
  });

  const hasAnalyticsPermission = userData?.role === 'admin' || userData?.permissions?.canViewAnalytics;

  const { data: orderStats } = useQuery({
    queryKey: ['orderStats'],
    queryFn: adminService.getOrderStats,
    enabled: hasAnalyticsPermission, // Only fetch if user has permission
    retry: false
  });

  const { data: productStats } = useQuery({
    queryKey: ['productStats'],
    queryFn: adminService.getProductStats,
    enabled: hasAnalyticsPermission, // Only fetch if user has permission
    retry: false
  });

  // Get out-of-stock products
  const { data: outOfStockData } = useQuery({
    queryKey: ['products', 'out-of-stock'],
    queryFn: () => adminService.getProducts({ inStock: false, limit: 10 }),
    retry: false
  });

  // Get categories and pet types for navigation menu
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminService.getAllCategoriesAdmin,
    retry: false
  });

  const { data: petTypesData } = useQuery({
    queryKey: ['pet-types'],
    queryFn: adminService.getPetTypes,
    retry: false
  });

  // Group categories by pet type
  const categoriesByPetType = () => {
    if (!categoriesData?.data || !petTypesData?.data) return {};
    
    const grouped: any = {};
    const allCategories = categoriesData.data;
    
    // Initialize with pet types
    petTypesData.data.forEach((petType: any) => {
      grouped[petType.slug] = {
        petType: petType,
        mainCategories: [],
        totalCategories: 0,
        totalSubcategories: 0
      };
    });

    // Group categories
    allCategories.forEach((category: any) => {
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
  };

  const categoriesByPet = categoriesByPetType();

  // Check if user has permission issues
  const hasPermissionError = !hasAnalyticsPermission;

  // Mock data for sales chart
  const salesData = [
    { month: 'Jan', sales: 4000 },
    { month: 'Feb', sales: 3000 },
    { month: 'Mar', sales: 5000 },
    { month: 'Apr', sales: 4500 },
    { month: 'May', sales: 6000 },
    { month: 'Jun', sales: 5500 }
  ];

  // Generate category data from actual navigation menu categories
  const categoryData = (() => {
    if (!categoriesData?.data) {
      // Fallback mock data if categories not loaded yet
      return [
        { name: 'Dog Food', value: 4000 },
        { name: 'Cat Food', value: 3000 },
        { name: 'Toys', value: 2000 },
        { name: 'Accessories', value: 2780 }
      ];
    }

    const allCategories = categoriesData.data;
    const categoryCounts: { [key: string]: number } = {};

    // Count main categories (level 1) by name, grouped by pet type
    allCategories.forEach((category: any) => {
      if (!category.parentCategory && category.level === 1) {
        const petTypePrefix = category.petType === 'dog' ? '🐕 ' : 
                             category.petType === 'cat' ? '🐱 ' : 
                             category.petType === 'other-animals' ? '🐾 ' : '';
        const displayName = `${petTypePrefix}${category.name}`;
        
        // Count subcategories for each main category (for chart value)
        const subcategoryCount = allCategories.filter((cat: any) => 
          (cat.parentCategory?._id === category._id || cat.parentCategory === category._id) && cat.level === 2
        ).length;
        
        // Use subcategory count as value, or default to 1 if no subcategories
        categoryCounts[displayName] = Math.max(subcategoryCount, 1);
      }
    });

    // Convert to array format for chart, sorted by value (descending)
    const chartData = Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12); // Top 12 categories

    return chartData.length > 0 ? chartData : [
      { name: 'Loading...', value: 0 }
    ];
  })();

  return (
    <div className="space-y-8">
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
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-xl p-6 shadow-lg animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-full">
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

      {/* Stats Grid with Staggered Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-animation">
        <StatCard
          title="Total Revenue"
          value={`$${orderStats?.totalRevenue?.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          color="green"
          trend={{ value: '12.5% from last month', isPositive: true }}
        />
        <StatCard
          title="Total Orders"
          value={orderStats?.totalOrders || 0}
          icon={ShoppingCart}
          color="blue"
          trend={{ value: '8.2% from last month', isPositive: true }}
        />
        <StatCard
          title="Total Products"
          value={productStats?.totalProducts || 0}
          icon={Package}
          color="yellow"
        />
        <StatCard
          title="Pending Orders"
          value={orderStats?.pendingOrders || 0}
          icon={TrendingUp}
          color="red"
        />
      </div>

      {/* Out of Stock Alert - Enhanced */}
      {outOfStockData && outOfStockData.data.length > 0 && (
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
                {outOfStockData.data.slice(0, 5).map((product: any) => (
                  <div key={product._id} className="flex items-center justify-between bg-white p-4 rounded-lg border-2 border-red-200 hover:border-red-400 transition-all hover-lift shadow-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images[0]}
                        alt={product.name}
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
      )}

      {/* Charts - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all hover-lift animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900">Sales Overview</h2>
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 rounded-lg">
              <p className="text-sm font-bold text-blue-800">Last 6 Months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#0284c7" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all hover-lift animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900">Navigation Menu Categories</h2>
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-lg">
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
              {Object.entries(categoriesByPet).map(([petTypeSlug, data]: [string, any]) => (
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
                      data.mainCategories.map((category: any) => (
                        <Link
                          key={category._id}
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all animate-fade-in-up">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-2xl font-black text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orderStats?.recentOrders?.map((order: any) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    {order.user?.firstName} {order.user?.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm">${order.totalPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No recent orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;




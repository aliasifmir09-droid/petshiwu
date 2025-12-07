import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { normalizeImageUrl, handleImageError } from '@/utils/imageUtils';
import {
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Package,
  TrendingDown,
  Heart
} from 'lucide-react';
import Dropdown from '@/components/Dropdown';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30d'); // 1d, 7d, 30d, 90d, 1y, all

  // Fetch order stats
  const { data: orderStats, isLoading: loadingOrders } = useQuery({
    queryKey: ['orderStats'],
    queryFn: adminService.getOrderStats
  });

  // Fetch product stats
  const { data: productStats, isLoading: loadingProducts } = useQuery({
    queryKey: ['productStats'],
    queryFn: adminService.getProductStats
  });

  // Fetch advanced analytics
  const { data: advancedAnalytics, isLoading: loadingAdvanced } = useQuery({
    queryKey: ['advancedAnalytics', timeRange],
    queryFn: () => adminService.getAdvancedAnalytics(timeRange),
    enabled: true
  });

  // Fetch orders for detailed analytics - use reasonable limit to improve performance
  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'analytics', timeRange],
    queryFn: () => adminService.getAllOrders({ page: 1, limit: 500 }), // Reduced from 1000 to 500
    staleTime: 2 * 60 * 1000, // Consider fresh for 2 minutes
    gcTime: 10 * 60 * 1000 // Cache for 10 minutes
  });

  // Get time range in days
  const getTimeRangeDays = () => {
    switch (timeRange) {
      case '1d': return 1;
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      case 'all': return 9999;
      default: return 30;
    }
  };

  // Calculate analytics metrics based on selected time range
  const calculateMetrics = useMemo(() => {
    if (!ordersData?.data) return null;

    const orders = ordersData.data;
    const now = new Date();
    const days = getTimeRangeDays();
    const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

    // Current period orders
    const currentOrders = orders.filter((o: any) => new Date(o.createdAt) > currentPeriodStart);
    const currentRevenue = currentOrders.reduce((sum: number, o: any) => sum + o.totalPrice, 0);
    const currentDonations = currentOrders.reduce((sum: number, o: any) => sum + (o.donationAmount || 0), 0);
    const currentDonationCount = currentOrders.filter((o: any) => (o.donationAmount || 0) > 0).length;
    
    // Previous period orders (for comparison)
    const previousOrders = orders.filter((o: any) => {
      const date = new Date(o.createdAt);
      return date > previousPeriodStart && date <= currentPeriodStart;
    });
    const previousRevenue = previousOrders.reduce((sum: number, o: any) => sum + o.totalPrice, 0);
    const previousDonations = previousOrders.reduce((sum: number, o: any) => sum + (o.donationAmount || 0), 0);
    const previousDonationCount = previousOrders.filter((o: any) => (o.donationAmount || 0) > 0).length;

    // Calculate growth percentages
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : currentRevenue > 0 ? 100 : 0;
    const orderGrowth = previousOrders.length > 0
      ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
      : currentOrders.length > 0 ? 100 : 0;
    const donationGrowth = previousDonations > 0
      ? ((currentDonations - previousDonations) / previousDonations) * 100
      : currentDonations > 0 ? 100 : 0;

    // Average order value
    const avgOrderValue = currentOrders.length > 0 
      ? currentRevenue / currentOrders.length 
      : 0;
    const prevAvgOrderValue = previousOrders.length > 0
      ? previousRevenue / previousOrders.length
      : 0;
    const avgOrderValueGrowth = prevAvgOrderValue > 0
      ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100
      : avgOrderValue > 0 ? 100 : 0;

    // Unique customers
    const uniqueCustomers = new Set(currentOrders.map((o: any) => o.user?._id || o.user)).size;
    const prevUniqueCustomers = new Set(previousOrders.map((o: any) => o.user?._id || o.user)).size;
    const customerGrowth = prevUniqueCustomers > 0
      ? ((uniqueCustomers - prevUniqueCustomers) / prevUniqueCustomers) * 100
      : uniqueCustomers > 0 ? 100 : 0;

    return {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        growth: revenueGrowth
      },
      orders: {
        current: currentOrders.length,
        previous: previousOrders.length,
        growth: orderGrowth
      },
      avgOrderValue: {
        current: avgOrderValue,
        previous: prevAvgOrderValue,
        growth: avgOrderValueGrowth
      },
      customers: {
        current: uniqueCustomers,
        previous: prevUniqueCustomers,
        growth: customerGrowth
      },
      donations: {
        current: currentDonations,
        previous: previousDonations,
        growth: donationGrowth,
        count: currentDonationCount,
        previousCount: previousDonationCount,
        average: currentDonationCount > 0 ? currentDonations / currentDonationCount : 0
      }
    };
  }, [ordersData, timeRange]);

  // Generate revenue trend data based on time range
  const generateRevenueTrend = useMemo(() => {
    if (!ordersData?.data) return [];

    const days = getTimeRangeDays();
    const now = new Date();
    const data = [];

    // Determine aggregation level
    let groupBy = 'day'; // day, week, month
    if (days > 180) groupBy = 'month';
    else if (days > 60) groupBy = 'week';

    if (groupBy === 'day') {
      const numDays = Math.min(days, 90); // Cap at 90 days for daily view
      for (let i = numDays - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const dayOrders = ordersData.data.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= dayStart && orderDate <= dayEnd;
        });

        const revenue = dayOrders.reduce((sum: number, o: any) => sum + o.totalPrice, 0);
        const donations = dayOrders.reduce((sum: number, o: any) => sum + (o.donationAmount || 0), 0);

        data.push({
          date: days === 1 
            ? dayStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: Math.round(revenue * 100) / 100,
          donations: Math.round(donations * 100) / 100,
          orders: dayOrders.length
        });
      }
    } else if (groupBy === 'week') {
      const numWeeks = Math.ceil(days / 7);
      for (let i = numWeeks - 1; i >= 0; i--) {
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);

        const weekOrders = ordersData.data.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= weekStart && orderDate <= weekEnd;
        });

        const revenue = weekOrders.reduce((sum: number, o: any) => sum + o.totalPrice, 0);
        const donations = weekOrders.reduce((sum: number, o: any) => sum + (o.donationAmount || 0), 0);

        data.push({
          date: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          revenue: Math.round(revenue * 100) / 100,
          donations: Math.round(donations * 100) / 100,
          orders: weekOrders.length
        });
      }
    } else {
      // Monthly aggregation
      const numMonths = Math.ceil(days / 30);
      for (let i = numMonths - 1; i >= 0; i--) {
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);

        const monthOrders = ordersData.data.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });

        const revenue = monthOrders.reduce((sum: number, o: any) => sum + o.totalPrice, 0);
        const donations = monthOrders.reduce((sum: number, o: any) => sum + (o.donationAmount || 0), 0);

        data.push({
          date: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: Math.round(revenue * 100) / 100,
          donations: Math.round(donations * 100) / 100,
          orders: monthOrders.length
        });
      }
    }

    return data;
  }, [ordersData, timeRange]);

  // Generate category performance data based on time range
  const generateCategoryPerformance = useMemo(() => {
    if (!ordersData?.data) return [];

    const days = getTimeRangeDays();
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const categoryRevenue: Record<string, { revenue: number; orders: number }> = {};

    ordersData.data
      .filter((order: any) => new Date(order.createdAt) > startDate)
      .forEach((order: any) => {
        order.items.forEach((item: any) => {
          const category = item.product?.category?.name || item.category?.name || 'Uncategorized';
          if (!categoryRevenue[category]) {
            categoryRevenue[category] = { revenue: 0, orders: 0 };
          }
          categoryRevenue[category].revenue += item.price * item.quantity;
          categoryRevenue[category].orders += 1;
        });
      });

    return Object.entries(categoryRevenue)
      .map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.orders
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 categories
  }, [ordersData, timeRange]);

  // Order status distribution
  const generateOrderStatusData = () => {
    if (!orderStats || !orderStats.statusBreakdown) return [];

    const data = [
      { name: 'Pending', value: orderStats.statusBreakdown.pending || 0, color: '#f59e0b' },
      { name: 'Processing', value: orderStats.statusBreakdown.processing || 0, color: '#3b82f6' },
      { name: 'Shipped', value: orderStats.statusBreakdown.shipped || 0, color: '#8b5cf6' },
      { name: 'Delivered', value: orderStats.statusBreakdown.delivered || 0, color: '#10b981' },
      { name: 'Cancelled', value: orderStats.statusBreakdown.cancelled || 0, color: '#ef4444' }
    ];

    // Filter out zero values for cleaner display
    return data.filter(item => item.value > 0);
  };

  const statusData = generateOrderStatusData();

  // Export analytics data
  const exportAnalytics = () => {
    const data = {
      period: timeRange,
      exportDate: new Date().toISOString(),
      metrics: calculateMetrics,
      revenueTrend: generateRevenueTrend,
      categoryPerformance: generateCategoryPerformance,
      orderStatus: statusData
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get time range label
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '1d': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last Year';
      case 'all': return 'All Time';
      default: return 'Last 30 Days';
    }
  };

  // Metric Card Component
  const MetricCard = ({ title, value, growth, icon: Icon, format = 'number' }: any) => {
    const isPositive = growth >= 0;
    const formattedValue = format === 'currency' 
      ? `$${value.toFixed(2)}`
      : format === 'percentage'
      ? `${value.toFixed(1)}%`
      : value.toLocaleString();

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{formattedValue}</h3>
            <div className="flex items-center gap-2">
              <span className={`flex items-center text-sm font-semibold ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {Math.abs(growth).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500">vs last period</span>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${
            isPositive ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <Icon className={isPositive ? 'text-green-600' : 'text-red-600'} size={24} />
          </div>
        </div>
      </div>
    );
  };

  if (loadingOrders || loadingProducts) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 lg:p-8 shadow-xl animate-fade-in-up">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Analytics Dashboard</h1>
            <div className="flex items-center gap-2 text-blue-100">
              <Calendar size={18} />
              <p className="text-lg">{getTimeRangeLabel()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={exportAnalytics}
              className="flex items-center gap-2 bg-white text-[#1E3A8A] px-6 py-3 rounded-xl hover:bg-blue-50 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 btn-ripple"
            >
              <Download size={20} />
              <span>Export Data</span>
            </button>
            <Dropdown
              options={[
                { value: '1d', label: 'Last 24 Hours', description: 'Hourly breakdown' },
                { value: '7d', label: 'Last 7 Days', description: 'Daily breakdown' },
                { value: '30d', label: 'Last 30 Days', description: 'Daily breakdown' },
                { value: '90d', label: 'Last 90 Days', description: 'Weekly breakdown' },
                { value: '1y', label: 'Last Year', description: 'Monthly breakdown' },
                { value: 'all', label: 'All Time', description: 'Full history' }
              ]}
              value={timeRange}
              onChange={setTimeRange}
              icon={<Calendar size={18} />}
              className="w-64"
            />
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300 opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Key Metrics */}
      {calculateMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-animation">
          <MetricCard
            title="Total Revenue"
            value={calculateMetrics.revenue.current}
            growth={calculateMetrics.revenue.growth}
            icon={DollarSign}
            format="currency"
          />
          <MetricCard
            title="Total Orders"
            value={calculateMetrics.orders.current}
            growth={calculateMetrics.orders.growth}
            icon={ShoppingCart}
          />
          <MetricCard
            title="Avg Order Value"
            value={calculateMetrics.avgOrderValue.current}
            growth={calculateMetrics.avgOrderValue.growth}
            icon={TrendingUp}
            format="currency"
          />
          <MetricCard
            title="Customers"
            value={calculateMetrics.customers.current}
            growth={calculateMetrics.customers.growth}
            icon={Users}
          />
          {calculateMetrics.donations && (
            <>
              <MetricCard
                title="Total Donations"
                value={calculateMetrics.donations.current}
                growth={calculateMetrics.donations.growth}
                icon={Heart}
                format="currency"
              />
              <MetricCard
                title="Donation Orders"
                value={calculateMetrics.donations.count}
                growth={calculateMetrics.donations.previousCount > 0 
                  ? ((calculateMetrics.donations.count - calculateMetrics.donations.previousCount) / calculateMetrics.donations.previousCount) * 100
                  : calculateMetrics.donations.count > 0 ? 100 : 0}
                icon={Package}
              />
            </>
          )}
        </div>
      )}

      {/* Show message if no metrics available */}
      {!calculateMetrics && !loadingOrders && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
          <TrendingUp className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Analytics Data Available</h3>
          <p className="text-gray-600">Start receiving orders to see analytics and insights here.</p>
        </div>
      )}

      {/* Revenue & Orders Trend */}
      {generateRevenueTrend.length > 0 && (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Revenue & Orders Trend</h2>
            <p className="text-sm text-gray-600">
              {timeRange === '1d' ? 'Hourly' : timeRange === '7d' || timeRange === '30d' ? 'Daily' : timeRange === '90d' ? 'Weekly' : 'Monthly'} performance for {getTimeRangeLabel().toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sky-600"></div>
              <span className="text-gray-600">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-gray-600">Orders</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-600"></div>
              <span className="text-gray-600">Donations</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={generateRevenueTrend}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280" 
              fontSize={12}
              angle={generateRevenueTrend.length > 20 ? -45 : 0}
              textAnchor={generateRevenueTrend.length > 20 ? "end" : "middle"}
              height={generateRevenueTrend.length > 20 ? 80 : 30}
            />
            <YAxis yAxisId="left" stroke="#0284c7" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: any, name: string) => {
                if (name === 'Revenue ($)' || name === 'Donations ($)') return [`$${value.toFixed(2)}`, name];
                return [value, name];
              }}
            />
            <Legend />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="revenue" 
              stroke="#0284c7" 
              fillOpacity={1}
              fill="url(#colorRevenue)" 
              strokeWidth={2}
              name="Revenue ($)"
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="donations" 
              stroke="#ec4899" 
              fillOpacity={1}
              fill="url(#colorDonations)" 
              strokeWidth={2}
              name="Donations ($)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="orders" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: generateRevenueTrend.length < 15 ? 4 : 0 }}
              name="Orders"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      )}

      {/* Show message if no trend data */}
      {generateRevenueTrend.length === 0 && !loadingOrders && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center animate-fade-in-up">
          <TrendingUp className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Revenue Data Available</h3>
          <p className="text-gray-600">Revenue trends will appear here once you have orders in the selected time period.</p>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        {statusData.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all animate-fade-in-up">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Order Status Distribution</h2>
            <p className="text-sm text-gray-600">Current order statuses</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        )}

        {/* Show message if no status data */}
        {statusData.length === 0 && !loadingOrders && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center animate-fade-in-up">
            <ShoppingCart className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Order Status Data</h3>
            <p className="text-gray-600">Order status distribution will appear here once you have orders.</p>
          </div>
        )}

        {/* Donation Trends Chart */}
        {generateRevenueTrend.length > 0 && calculateMetrics?.donations && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all animate-fade-in-up">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Heart className="text-pink-500" size={24} />
                Donation Trends
              </h2>
              <p className="text-sm text-gray-600">Donations received over time</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={generateRevenueTrend.filter((d: any) => d.donations > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280" 
                  fontSize={12}
                  angle={generateRevenueTrend.length > 20 ? -45 : 0}
                  textAnchor={generateRevenueTrend.length > 20 ? "end" : "middle"}
                  height={generateRevenueTrend.length > 20 ? 80 : 30}
                />
                <YAxis stroke="#ec4899" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'Donations']}
                />
                <Bar 
                  dataKey="donations" 
                  fill="#ec4899" 
                  radius={[8, 8, 0, 0]}
                  name="Donations ($)"
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Donations</p>
                <p className="text-xl font-bold text-pink-600">
                  ${calculateMetrics.donations.current.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Donation Orders</p>
                <p className="text-xl font-bold text-gray-900">
                  {calculateMetrics.donations.count}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Donation</p>
                <p className="text-xl font-bold text-gray-900">
                  ${calculateMetrics.donations.average.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Category Performance */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all animate-fade-in-up">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Top Categories</h2>
            <p className="text-sm text-gray-600">Revenue by product category for {getTimeRangeLabel().toLowerCase()}</p>
          </div>
          {generateCategoryPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={generateCategoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'revenue') return [`$${value.toFixed(2)}`, 'Revenue'];
                    if (name === 'orders') return [value, 'Orders'];
                    return [value, name];
                  }}
                />
                <Legend 
                  formatter={(value) => value === 'revenue' ? 'Revenue' : 'Orders'}
                />
                <Bar dataKey="revenue" fill="#0284c7" radius={[8, 8, 0, 0]} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Package size={48} className="mx-auto mb-2 opacity-50" />
                <p>No category data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Insights */}
      {calculateMetrics && ordersData?.data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Items per Order */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Avg Items/Order</p>
                <h3 className="text-2xl font-bold text-blue-900">
                  {calculateMetrics.orders.current > 0
                    ? (ordersData.data
                        .filter((o: any) => new Date(o.createdAt) > new Date(Date.now() - getTimeRangeDays() * 24 * 60 * 60 * 1000))
                        .reduce((sum: number, o: any) => sum + (o.items?.length || 0), 0) / calculateMetrics.orders.current)
                        .toFixed(2)
                    : '0.00'}
                </h3>
              </div>
              <Package className="text-blue-600" size={32} />
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-900 mb-1">Completion Rate</p>
                <h3 className="text-2xl font-bold text-green-900">
                  {orderStats?.statusBreakdown?.delivered && calculateMetrics.orders.current > 0
                    ? ((orderStats.statusBreakdown.delivered / calculateMetrics.orders.current) * 100).toFixed(1)
                    : '0.0'}%
                </h3>
              </div>
              <TrendingUp className="text-green-600" size={32} />
            </div>
          </div>

          {/* Cancellation Rate */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm border border-red-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-red-900 mb-1">Cancellation Rate</p>
                <h3 className="text-2xl font-bold text-red-900">
                  {orderStats?.statusBreakdown?.cancelled && calculateMetrics.orders.current > 0
                    ? ((orderStats.statusBreakdown.cancelled / calculateMetrics.orders.current) * 100).toFixed(1)
                    : '0.0'}%
                </h3>
              </div>
              <TrendingDown className="text-red-600" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Top Products */}
      {productStats?.popularProducts && productStats.popularProducts.length > 0 && (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 animate-fade-in-up">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Top Products</h2>
          <p className="text-sm text-gray-600">Best performing products by revenue</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productStats?.popularProducts?.slice(0, 10).map((product: any, index: number) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <div className="flex items-center gap-3">
                        <img
                          src={normalizeImageUrl(product.images?.[0])}
                          alt={product.name}
                          onError={(e) => handleImageError(e, product.name)}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.brand}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.category?.name || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {product.totalSold || 0}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    ${((product.totalSold || 0) * product.basePrice).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center text-sm font-semibold text-green-600">
                      <TrendingUp size={14} className="mr-1" />
                      12.5%
                    </span>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No product data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Show message if no product data */}
      {(!productStats?.popularProducts || productStats.popularProducts.length === 0) && !loadingProducts && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center animate-fade-in-up">
          <Package className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Product Data Available</h3>
          <p className="text-gray-600">Top products will appear here once you have product sales data.</p>
        </div>
      )}

      {/* Advanced Analytics Section */}
      {loadingAdvanced ? (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
          <p className="text-gray-600">Loading advanced analytics...</p>
        </div>
      ) : advancedAnalytics && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          
          {/* Customer Lifetime Value */}
          {advancedAnalytics.customerLifetimeValue && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Customer Lifetime Value</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Average CLV</p>
                  <p className="text-2xl font-bold text-blue-600">${advancedAnalytics.customerLifetimeValue.averageCLV.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                  <p className="text-2xl font-bold text-green-600">{advancedAnalytics.customerLifetimeValue.totalCustomers}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Top Customers</p>
                  <p className="text-2xl font-bold text-purple-600">{Math.min(10, advancedAnalytics.customerLifetimeValue.topCustomers.length)}</p>
                </div>
              </div>
              {advancedAnalytics.customerLifetimeValue.topCustomers.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Order Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {advancedAnalytics.customerLifetimeValue.topCustomers.slice(0, 10).map((customer: any) => (
                        <tr key={customer.userId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {customer.email || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium">${customer.totalSpent.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-sm">{customer.orderCount}</td>
                          <td className="px-4 py-3 text-right text-sm">${customer.averageOrderValue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Product Performance */}
          {advancedAnalytics.productPerformance && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Product Performance Metrics</h3>
              {advancedAnalytics.productPerformance.topProducts.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Sold</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conversion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {advancedAnalytics.productPerformance.topProducts.slice(0, 10).map((product: any) => (
                        <tr key={product.productId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{product.productName || 'Unknown'}</td>
                          <td className="px-4 py-3 text-right text-sm">{product.totalSold}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium">${product.totalRevenue.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-sm">{product.orderCount}</td>
                          <td className="px-4 py-3 text-right text-sm">{(product.conversionRate * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sales Forecast */}
          {advancedAnalytics.salesForecast && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Sales Forecasting</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Forecasted Revenue (30 Days)</p>
                  <p className="text-2xl font-bold text-blue-600">${advancedAnalytics.salesForecast.forecastedRevenue30Days.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Forecasted Orders (30 Days)</p>
                  <p className="text-2xl font-bold text-green-600">{advancedAnalytics.salesForecast.forecastedOrders30Days}</p>
                </div>
                <div className={`p-4 rounded-lg ${advancedAnalytics.salesForecast.trend >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-sm text-gray-600 mb-1">Trend</p>
                  <p className={`text-2xl font-bold ${advancedAnalytics.salesForecast.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {advancedAnalytics.salesForecast.trend >= 0 ? '+' : ''}{advancedAnalytics.salesForecast.trend.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Turnover */}
          {advancedAnalytics.inventoryTurnover && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Inventory Turnover Analysis</h3>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Average Turnover Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{(advancedAnalytics.inventoryTurnover.averageTurnoverRate * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Slow Moving Products</p>
                  <p className="text-2xl font-bold text-orange-600">{advancedAnalytics.inventoryTurnover.slowMovingProducts}</p>
                </div>
              </div>
              {advancedAnalytics.inventoryTurnover.products.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Sold</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Turnover Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Days to Sell Out</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {advancedAnalytics.inventoryTurnover.products.slice(0, 10).map((product: any) => (
                        <tr key={product.productId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{product.productName || 'Unknown'}</td>
                          <td className="px-4 py-3 text-right text-sm">{product.currentStock}</td>
                          <td className="px-4 py-3 text-right text-sm">{product.totalSold}</td>
                          <td className="px-4 py-3 text-right text-sm">{(product.turnoverRate * 100).toFixed(1)}%</td>
                          <td className="px-4 py-3 text-right text-sm">{product.daysToSellOut === 999 ? 'N/A' : product.daysToSellOut.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;


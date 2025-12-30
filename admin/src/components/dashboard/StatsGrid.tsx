import StatCard from '@/components/StatCard';
import { DollarSign, Package, ShoppingCart, TrendingUp, RefreshCw, Download } from 'lucide-react';
import { UI } from '@/utils/dashboardConstants';
import { OrderStats, ProductStats } from '@/pages/Dashboard';

interface StatsGridProps {
  orderStats: OrderStats | undefined;
  productStats: ProductStats | undefined;
  orderStatsLoading: boolean;
  productStatsLoading: boolean;
  isRefreshing: boolean;
  revenueTrend: { value: string; isPositive: boolean } | null;
  ordersTrend: { value: string; isPositive: boolean } | null;
  onExportOrderStats?: () => void;
  onExportProductStats?: () => void;
}

const StatsGrid = ({
  orderStats,
  productStats,
  orderStatsLoading,
  productStatsLoading,
  isRefreshing,
  revenueTrend,
  ordersTrend,
  onExportOrderStats,
  onExportProductStats,
}: StatsGridProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        {onExportOrderStats && (
          <button
            onClick={onExportOrderStats}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Export order statistics"
          >
            <Download size={14} />
            Export Order Stats
          </button>
        )}
        {onExportProductStats && (
          <button
            onClick={onExportProductStats}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Export product statistics"
          >
            <Download size={14} />
            Export Product Stats
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-animation" role="region" aria-label="Statistics overview">
      {/* Subtle refresh indicator */}
      {(orderStatsLoading || productStatsLoading || isRefreshing) && (
        <div className="col-span-full flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
          <RefreshCw size={UI.ICON_SIZE_SMALL} className="animate-spin" />
          <span>Updating data...</span>
        </div>
      )}
      {orderStatsLoading || productStatsLoading ? (
        // Skeleton loaders for stats cards
        <>
          {Array.from({ length: UI.STATS_CARDS_SKELETON_COUNT }).map((_, i) => (
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
            value={orderStatsLoading || orderStats?.totalRevenue === undefined 
              ? 'N/A' 
              : `$${(orderStats.totalRevenue).toFixed(2)}`}
            icon={DollarSign}
            color="green"
            trend={revenueTrend || undefined}
            tooltip="Total revenue from all completed orders. This includes all sales revenue."
          />
          <StatCard
            title="Total Orders"
            value={orderStatsLoading || orderStats?.totalOrders === undefined 
              ? 'N/A' 
              : orderStats.totalOrders}
            icon={ShoppingCart}
            color="blue"
            trend={ordersTrend || undefined}
            tooltip="Total number of orders placed by customers. Includes all order statuses."
          />
          <StatCard
            title="Total Products"
            value={productStatsLoading || productStats?.totalProducts === undefined
              ? 'N/A'
              : productStats.totalProducts}
            icon={Package}
            color="yellow"
            tooltip="Total number of products in your inventory. Includes both active and inactive products."
          />
          <StatCard
            title="Pending Orders"
            value={orderStatsLoading || orderStats?.pendingOrders === undefined
              ? 'N/A'
              : orderStats.pendingOrders}
            icon={TrendingUp}
            color="red"
            tooltip="Number of orders awaiting processing. These orders need attention to be fulfilled."
          />
        </>
      )}
      </div>
    </div>
  );
};

export default StatsGrid;


import { useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, ChevronRight, Inbox, Eye, ArrowUpDown, Filter } from 'lucide-react';
import { RecentOrder, OrderStats } from '@/pages/Dashboard';
import { formatDate } from '@/utils/dateUtils';
import { validateRecentOrder } from '@/utils/dataValidation';
import { maskCustomerName, canViewFullCustomerData } from '@/utils/privacyUtils';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, isValidOrderStatus } from '@/utils/constants';
import { exportRecentOrders } from '@/utils/exportUtils';
import { UI } from '@/utils/dashboardConstants';

interface RecentOrdersTableProps {
  orderStats: OrderStats | undefined;
  orderStatsLoading: boolean;
  orderStatsError: Error | null;
  userRole?: string;
  userPermissions?: { canViewFullCustomerData?: boolean };
  onExportSuccess: (message: string) => void;
}

// Helper function to safely convert any ID to a unique string key
const getUniqueKey = (id: string | number | undefined | null | { toString?: () => string; valueOf?: () => unknown }, index: number, prefix: string = 'item'): string => {
  if (id === null || id === undefined) {
    return `${prefix}-${index}`;
  }
  if (typeof id === 'string') {
    return `${id}-${index}`;
  }
  if (typeof id === 'number') {
    return `${id}-${index}`;
  }
  if (typeof id === 'object' && id !== null) {
    if (id.toString && typeof id.toString === 'function') {
      try {
        const str = id.toString();
        if (str && str !== '[object Object]') {
          return `${str}-${index}`;
        }
      } catch (e) {
        // Fall through
      }
    }
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
  }
  return `${prefix}-${index}`;
};

const RecentOrdersTable = memo(({
  orderStats,
  orderStatsLoading,
  orderStatsError,
  userRole,
  userPermissions,
  onExportSuccess,
}: RecentOrdersTableProps) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const ordersPerPage = 5;

  const recentOrders = orderStats?.recentOrders;
  const canViewFullData = canViewFullCustomerData(userRole, userPermissions);

  if (orderStatsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all animate-fade-in-up" role="region" aria-label="Recent orders">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-gray-900">Recent Orders</h2>
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
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (orderStatsError) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all animate-fade-in-up" role="region" aria-label="Recent orders">
        <div className="p-6">
          <div className="text-center text-red-600">
            Failed to load recent orders. Please refresh the page.
          </div>
        </div>
      </div>
    );
  }

  if (!recentOrders || !Array.isArray(recentOrders) || recentOrders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all animate-fade-in-up" role="region" aria-label="Recent orders">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-gray-900">Recent Orders</h2>
            <Link
              to="/orders"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm"
            >
              View All
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
        <div className="p-12 text-center">
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
        </div>
      </div>
    );
  }

  // Filter and validate orders
  let validOrders = recentOrders.filter(validateRecentOrder);

  // Apply status filter
  if (statusFilter) {
    validOrders = validOrders.filter((order: RecentOrder) =>
      order.orderStatus?.toLowerCase() === statusFilter.toLowerCase()
    );
  }

  // Sort orders
  validOrders = [...validOrders].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      comparison = dateA - dateB;
    } else if (sortBy === 'total') {
      comparison = (a.totalPrice ?? 0) - (b.totalPrice ?? 0);
    } else if (sortBy === 'status') {
      comparison = (a.orderStatus || '').localeCompare(b.orderStatus || '');
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Paginate orders
  const totalPages = Math.ceil(validOrders.length / ordersPerPage);
  const startIndex = (page - 1) * ordersPerPage;
  const paginatedOrders = validOrders.slice(startIndex, startIndex + ordersPerPage);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all animate-fade-in-up" role="region" aria-label="Recent orders">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-gray-900">Recent Orders</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (recentOrders.length > 0) {
                  exportRecentOrders(recentOrders as RecentOrder[]);
                  onExportSuccess('Orders exported successfully');
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
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
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'total' | 'status')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="total">Sort by Total</option>
              <option value="status">Sort by Status</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown size={16} className={sortOrder === 'desc' ? 'rotate-180' : ''} />
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
            {paginatedOrders.map((order: RecentOrder, index: number) => {
              if (!order) return null;
              const orderId = order._id || order.orderNumber || '';
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
                    {(() => {
                      const status = order.orderStatus || '';
                      const isValidStatus = isValidOrderStatus(status);
                      const statusColors = isValidStatus
                        ? ORDER_STATUS_COLORS[status]
                        : { bg: 'bg-gray-100', text: 'text-gray-800' };
                      const statusLabel = isValidStatus ? ORDER_STATUS_LABELS[status] : status || 'Unknown';

                      return (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                          aria-label={`Order status: ${statusLabel}`}
                        >
                          {statusLabel}
                        </span>
                      );
                    })()}
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
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

RecentOrdersTable.displayName = 'RecentOrdersTable';

export default RecentOrdersTable;


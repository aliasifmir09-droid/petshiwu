import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { 
  AlertTriangle, 
  Package, 
  Settings,
  RefreshCw,
  Search,
  X
} from 'lucide-react';

interface LowStockProduct {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  totalStock: number;
  lowStockThreshold: number | null;
  category?: {
    name: string;
    slug: string;
  };
  brand?: string;
  basePrice: number;
}

const InventoryAlerts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [thresholdFilter, setThresholdFilter] = useState<'all' | 'custom' | 'global'>('all');
  const [globalThreshold, setGlobalThreshold] = useState<number>(10);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LowStockProduct | null>(null);
  const [newThreshold, setNewThreshold] = useState<string>('');
  const { toast, showToast, hideToast } = useToast();
  const queryClient = useQueryClient();

  // Fetch low stock products
  const { data: lowStockData, isLoading, refetch } = useQuery({
    queryKey: ['low-stock-products', thresholdFilter, globalThreshold],
    queryFn: async () => {
      const params: any = {};
      if (thresholdFilter === 'global') {
        params.globalThreshold = globalThreshold;
      }
      const response = await adminService.getLowStockProducts(params);
      return response.data || response;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const lowStockProducts = lowStockData?.products || [];
  const totalCount = lowStockData?.count || 0;

  // Update threshold mutation
  const updateThresholdMutation = useMutation({
    mutationFn: ({ productId, threshold }: { productId: string; threshold: number | null }) =>
      adminService.updateProductThreshold(productId, threshold),
    onSuccess: async () => {
      showToast('Low stock threshold updated successfully', 'success');
      setShowThresholdModal(false);
      setSelectedProduct(null);
      await queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update threshold', 'error');
    }
  });

  // Bulk update thresholds mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (data: { productIds?: string[]; categoryId?: string; lowStockThreshold: number | null }) =>
      adminService.bulkUpdateThresholds(data),
    onSuccess: async () => {
      showToast('Bulk threshold update successful', 'success');
      await queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update thresholds', 'error');
    }
  });

  const handleOpenThresholdModal = (product: LowStockProduct) => {
    setSelectedProduct(product);
    setNewThreshold(product.lowStockThreshold?.toString() || '');
    setShowThresholdModal(true);
  };

  const handleUpdateThreshold = () => {
    if (!selectedProduct) return;
    
    const threshold = newThreshold.trim() === '' ? null : parseInt(newThreshold, 10);
    if (threshold !== null && (isNaN(threshold) || threshold < 0)) {
      showToast('Please enter a valid number (0 or greater)', 'error');
      return;
    }

    updateThresholdMutation.mutate({
      productId: selectedProduct._id,
      threshold
    });
  };

  const handleBulkUpdate = (threshold: number | null) => {
    if (threshold !== null && (isNaN(threshold) || threshold < 0)) {
      showToast('Please enter a valid number (0 or greater)', 'error');
      return;
    }

    bulkUpdateMutation.mutate({
      lowStockThreshold: threshold
    });
  };

  // Filter products
  const filteredProducts = lowStockProducts.filter((product: LowStockProduct) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesThreshold = 
      thresholdFilter === 'all' ||
      (thresholdFilter === 'custom' && product.lowStockThreshold !== null) ||
      (thresholdFilter === 'global' && product.lowStockThreshold === null);

    return matchesSearch && matchesThreshold;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inventory Alerts</h1>
          <p className="text-gray-600 mt-1">Monitor and manage low stock products</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Products</p>
              <p className="text-2xl font-bold mt-1">{totalCount}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertTriangle size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold mt-1">
                {lowStockProducts.filter((p: LowStockProduct) => p.totalStock === 0).length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <Package size={24} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Custom Thresholds</p>
              <p className="text-2xl font-bold mt-1">
                {lowStockProducts.filter((p: LowStockProduct) => p.lowStockThreshold !== null).length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Settings size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Threshold Filter */}
          <select
            value={thresholdFilter}
            onChange={(e) => setThresholdFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Products</option>
            <option value="custom">Custom Thresholds</option>
            <option value="global">Global Threshold Only</option>
          </select>

          {/* Global Threshold Input */}
          {thresholdFilter === 'global' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Global Threshold:</label>
              <input
                type="number"
                min="0"
                value={globalThreshold}
                onChange={(e) => setGlobalThreshold(parseInt(e.target.value) || 10)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold mb-3">Bulk Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleBulkUpdate(10)}
            disabled={bulkUpdateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            Set All to 10
          </button>
          <button
            onClick={() => handleBulkUpdate(20)}
            disabled={bulkUpdateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            Set All to 20
          </button>
          <button
            onClick={() => handleBulkUpdate(50)}
            disabled={bulkUpdateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            Set All to 50
          </button>
          <button
            onClick={() => handleBulkUpdate(null)}
            disabled={bulkUpdateMutation.isPending}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
          >
            Clear All Thresholds
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No products found matching your search' : 'No low stock products found'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product: LowStockProduct) => {
                  const isOutOfStock = product.totalStock === 0;
                  const threshold = product.lowStockThreshold ?? globalThreshold;
                  const isBelowThreshold = product.totalStock <= threshold;
                  
                  return (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover mr-3"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-product.png';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              {product.category?.name || 'Uncategorized'}
                              {product.brand && ` • ${product.brand}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.totalStock}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.lowStockThreshold !== null ? (
                            <span className="font-medium">{product.lowStockThreshold}</span>
                          ) : (
                            <span className="text-gray-400 italic">Global ({globalThreshold})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isOutOfStock
                            ? 'bg-red-100 text-red-800'
                            : isBelowThreshold
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : isBelowThreshold ? 'Low Stock' : 'OK'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleOpenThresholdModal(product)}
                          className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                        >
                          <Settings size={16} />
                          Configure
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Threshold Modal */}
      {showThresholdModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Set Low Stock Threshold</h2>
              <button
                onClick={() => {
                  setShowThresholdModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Product: <span className="font-medium">{selectedProduct.name}</span></p>
              <p className="text-sm text-gray-600">Current Stock: <span className="font-medium">{selectedProduct.totalStock}</span></p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Low Stock Threshold</label>
              <input
                type="number"
                min="0"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                placeholder="Leave empty to use global threshold"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use global threshold ({globalThreshold}). Set a custom value to override.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowThresholdModal(false);
                  setSelectedProduct(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateThreshold}
                disabled={updateThresholdMutation.isPending}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {updateThresholdMutation.isPending ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
};

export default InventoryAlerts;


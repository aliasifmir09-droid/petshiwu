import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { Plus, Edit, Trash2, Search, Filter, AlertTriangle, X, FolderTree, Layers, Package, Upload } from 'lucide-react';
import ProductForm from '@/components/ProductForm';
import CSVImport from '@/components/CSVImport';
import ConfirmationModal from '@/components/ConfirmationModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import Dropdown from '@/components/Dropdown';
import { normalizeImageUrl, handleImageError } from '@/utils/imageUtils';

const Products = () => {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [petTypeFilter, setPetTypeFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [dismissedNotification, setDismissedNotification] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    productId?: string;
    productName?: string;
    productIds?: string[];
    isBulk?: boolean;
  }>({ isOpen: false });

  const { data: productsData, isLoading, refetch } = useQuery({
    queryKey: ['products', page, searchQuery, categoryFilter, petTypeFilter, stockFilter],
    queryFn: () => adminService.getProducts({ 
      page, 
      limit: 20, 
      search: searchQuery || undefined,
      category: categoryFilter || undefined,
      petType: petTypeFilter || undefined,
      inStock: stockFilter === 'in-stock' ? true : stockFilter === 'out-of-stock' ? false : undefined
    }),
  });

  // Get out-of-stock products for notification bar
  const { data: outOfStockData } = useQuery({
    queryKey: ['products', 'out-of-stock-notification'],
    queryFn: () => adminService.getProducts({ inStock: false, limit: 100 }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: adminService.getCategories
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteProduct,
    onSuccess: (_, productId: string) => {
      const deletedId = String(productId);
      
      // Close delete confirmation modal immediately
      setDeleteConfirm({ isOpen: false });
      
      // Get current products count before deletion
      const currentProducts = productsData?.data || [];
      const willBeEmpty = currentProducts.length === 1;
      
      // Show success message immediately
      showToast('Product deleted successfully!', 'success');
      
      // Optimistically update ALL cached product queries to remove the deleted product
      queryClient.setQueriesData(
        { queryKey: ['products'], exact: false },
        (oldData: any) => {
          if (!oldData) return oldData;
          
          // Handle different response structures
          if (oldData.data && Array.isArray(oldData.data)) {
            const filteredData = oldData.data.filter((product: any) => {
              return String(product._id) !== deletedId;
            });
            
            return {
              ...oldData,
              data: filteredData,
              pagination: {
                ...oldData.pagination,
                total: Math.max(0, (oldData.pagination?.total || 0) - 1)
              }
            };
          }
          
          return oldData;
        }
      );
      
      // If this was the last product on the page, go to previous page
      if (willBeEmpty && page > 1) {
        setPage(page - 1);
      }
      
      // Only invalidate - it will automatically refetch if query is active
      queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
    },
    onError: (error: any, productId) => {
      console.error('Delete product error:', error);
      
      const deletedId = String(productId);
      
      // If product is already deleted (404), treat it as success and update UI
      if (error?.response?.status === 404) {
        // Product already deleted - optimistically remove it and refetch
        queryClient.setQueriesData(
          { queryKey: ['products'], exact: false },
          (oldData: any) => {
            if (!oldData || !oldData.data) return oldData;
            
            const filteredData = oldData.data.filter((product: any) => {
              return String(product._id) !== deletedId;
            });
            
            return {
              ...oldData,
              data: filteredData,
              pagination: {
                ...oldData.pagination,
                total: Math.max(0, (oldData.pagination?.total || 0) - 1)
              }
            };
          }
        );
        
        // Only invalidate - it will automatically refetch if query is active
        queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
        showToast('Product has been deleted', 'success');
        return;
      }
      
      showToast(error?.response?.data?.message || 'Failed to delete product. Please try again.', 'error');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      // Delete products one by one (or you could create a bulk delete endpoint)
      const results = await Promise.allSettled(
        productIds.map(async (id) => {
          try {
            await adminService.deleteProduct(id);
            return { success: true, id };
          } catch (error: any) {
            // If product is already deleted (404), treat it as success
            if (error?.response?.status === 404) {
              return { success: true, id, alreadyDeleted: true };
            }
            throw error;
          }
        })
      );
      return results;
    },
    onSuccess: async (results, variables) => {
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const deletedCount = variables.length; // Number of products that were attempted to be deleted
      const deletedIds = new Set(variables.map(id => String(id)));
      
      // Clear selection first
      setSelectedProducts(new Set());
      
      // Show success message
      if (succeeded > 0) {
        showToast(`${succeeded} product(s) deleted successfully!`, 'success');
      }
      if (failed > 0) {
        showToast(`${failed} product(s) failed to delete.`, 'error');
      }
      
      // Optimistically remove deleted products from ALL cached queries
      queryClient.setQueriesData(
        { queryKey: ['products'], exact: false },
        (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          
          // Filter out deleted products
          const filteredData = oldData.data.filter((product: any) => {
            const productId = String(product._id);
            return !deletedIds.has(productId);
          });
          
          return {
            ...oldData,
            data: filteredData,
            pagination: {
              ...oldData.pagination,
              total: Math.max(0, (oldData.pagination?.total || 0) - succeeded)
            }
          };
        }
      );
      
      // If we're on a page that might now be empty, reset to page 1
      const shouldResetPage = productsData?.data && productsData.data.length <= deletedCount;
      if (shouldResetPage && page > 1) {
        setPage(1);
      }
      
      // Immediately invalidate and refetch all product queries (no delay needed)
      // Only invalidate - it will automatically refetch if query is active
      queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Failed to delete products', 'error');
    }
  });

  const handleConfirmDelete = () => {
    if (deleteConfirm.isBulk && deleteConfirm.productIds) {
      // Bulk delete
      bulkDeleteMutation.mutate(deleteConfirm.productIds);
    } else if (deleteConfirm.productId) {
      // Single delete
      const productId = String(deleteConfirm.productId);
      deleteMutation.mutate(productId);
    }
    setDeleteConfirm({ isOpen: false });
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (productsData?.data) {
      if (selectedProducts.size === productsData.data.length) {
        // Deselect all
        setSelectedProducts(new Set());
      } else {
        // Select all on current page
        const allIds = productsData.data.map((p: any) => String(p._id));
        setSelectedProducts(new Set(allIds));
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.size === 0) return;
    
    const productIds = Array.from(selectedProducts);
    const productNames = productsData?.data
      ?.filter((p: any) => selectedProducts.has(String(p._id)))
      .map((p: any) => p.name)
      .slice(0, 3) || [];
    
    setDeleteConfirm({
      isOpen: true,
      productIds: productIds,
      isBulk: true,
      productName: selectedProducts.size === 1 
        ? productNames[0] 
        : `${selectedProducts.size} products`
    });
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 lg:p-8 shadow-xl animate-fade-in-up">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Products</h1>
            <p className="text-blue-100 text-lg">Manage your product catalog</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCSVImport(true)}
              className="flex items-center gap-2 bg-white/90 text-[#1E3A8A] px-6 py-3 rounded-xl hover:bg-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Upload size={20} />
              Import CSV
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-white text-[#1E3A8A] px-6 py-3 rounded-xl hover:bg-blue-50 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 btn-ripple"
            >
              <Plus size={20} />
              Add Product
            </button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300 opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold">Filters & Search</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Dropdown
            options={[
              { value: '', label: 'All Categories' },
              ...(categories?.map((cat: any) => ({
                value: cat._id,
                label: cat.name
              })) || [])
            ]}
            value={categoryFilter}
            onChange={setCategoryFilter}
            icon={<FolderTree size={18} />}
            size="md"
          />
          <Dropdown
            options={[
              { value: '', label: 'All Pet Types' },
              { value: 'dog', label: 'Dog' },
              { value: 'cat', label: 'Cat' }
            ]}
            value={petTypeFilter}
            onChange={setPetTypeFilter}
            icon={<Layers size={18} />}
            size="md"
          />
          <Dropdown
            options={[
              { value: '', label: 'All Stock Status' },
              { value: 'in-stock', label: 'In Stock' },
              { value: 'out-of-stock', label: 'Out of Stock' }
            ]}
            value={stockFilter}
            onChange={setStockFilter}
            icon={<Package size={18} />}
            size="md"
          />
        </div>
      </div>

      {/* Out of Stock Notification Bar */}
      {!dismissedNotification && outOfStockData && outOfStockData.data.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-l-4 border-red-600 rounded-xl p-6 shadow-xl animate-fade-in-up relative overflow-hidden">
          {/* Pulsing background effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 opacity-20 rounded-full blur-2xl animate-pulse-slow"></div>
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3 flex-1">
              <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-red-900">
                    ⚠️ {outOfStockData.data.length} Product{outOfStockData.data.length > 1 ? 's' : ''} Out of Stock
                  </h3>
                </div>
                <p className="text-red-700 text-sm mb-3">
                  The following products need restocking. Customers cannot add these items to their cart.
                </p>
                
                {/* Out of Stock Products List */}
                <div className="space-y-2 mb-3">
                  {outOfStockData.data.slice(0, 3).map((product: any) => (
                    <div 
                      key={product._id} 
                      className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-200"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={normalizeImageUrl(product.images?.[0])}
                          alt={product.name}
                          onError={(e) => handleImageError(e, product.name)}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-600">
                            {product.brand} • Stock: <span className="text-red-600 font-bold">{product.totalStock}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 text-sm font-medium whitespace-nowrap ml-3"
                      >
                        Restock Now
                      </button>
                    </div>
                  ))}
                  {outOfStockData.data.length > 3 && (
                    <p className="text-sm text-red-700 font-medium">
                      + {outOfStockData.data.length - 3} more product{outOfStockData.data.length - 3 > 1 ? 's' : ''} out of stock
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setStockFilter('out-of-stock');
                    setDismissedNotification(true);
                  }}
                  className="text-sm text-red-700 hover:text-red-800 font-semibold underline"
                >
                  View All Out of Stock Products →
                </button>
              </div>
            </div>
            
            {/* Dismiss Button */}
            <button
              onClick={() => setDismissedNotification(true)}
              className="text-red-600 hover:text-red-800 flex-shrink-0"
              title="Dismiss notification"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedProducts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-blue-900">
              {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={18} />
            {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete Selected (${selectedProducts.size})`}
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={productsData?.data && selectedProducts.size === productsData.data.length && productsData.data.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : productsData?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                productsData?.data.map((product: any) => {
                  const productId = String(product._id);
                  const isSelected = selectedProducts.has(productId);
                  
                  return (
                    <tr 
                      key={product._id} 
                      className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectProduct(productId)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={normalizeImageUrl(product.images?.[0])}
                            alt={product.name}
                            onError={(e) => handleImageError(e, product.name)}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {product.category?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        ${product.basePrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={product.totalStock > 0 ? 'text-green-600' : 'text-red-600'}>
                          {product.totalStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              // Normalize product ID to string
                              const productId = product._id ? String(product._id) : product._id;
                              setDeleteConfirm({
                                isOpen: true,
                                productId: productId,
                                productName: product.name
                              });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {productsData && productsData.pagination.pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {productsData.pagination.pages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === productsData.pagination.pages}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showModal && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
            // Refetch products when modal closes (in case product was created/updated)
            refetch();
          }}
        />
      )}

      {showCSVImport && (
        <CSVImport
          onClose={() => {
            setShowCSVImport(false);
          }}
          onImportComplete={async () => {
            // Reset to page 1 to see newly imported products
            setPage(1);
            
            // Invalidate cache and reset to page 1
            queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
            setPage(1);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm.isBulk ? "Delete Products" : "Delete Product"}
        message={
          deleteConfirm.isBulk
            ? `Are you sure you want to delete ${deleteConfirm.productIds?.length || 0} selected products? This action cannot be undone and will permanently remove these products from the system.`
            : `Are you sure you want to delete "${deleteConfirm.productName}"? This action cannot be undone and will permanently remove this product from the system.`
        }
        confirmText={deleteConfirm.isBulk ? `Delete ${deleteConfirm.productIds?.length || 0} Products` : "Delete Product"}
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isLoading={deleteConfirm.isBulk ? bulkDeleteMutation.isPending : deleteMutation.isPending}
        icon={
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="text-red-600" size={32} />
          </div>
        }
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
};

export default Products;




import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { Plus, Edit, Trash2, Search, Filter, AlertTriangle, X, FolderTree, Layers, Package } from 'lucide-react';
import ProductForm from '@/components/ProductForm';
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
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [petTypeFilter, setPetTypeFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [dismissedNotification, setDismissedNotification] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    productId?: string;
    productName?: string;
  }>({ isOpen: false });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', page, searchQuery, categoryFilter, petTypeFilter, stockFilter],
    queryFn: () => adminService.getProducts({ 
      page, 
      limit: 20, 
      search: searchQuery || undefined,
      category: categoryFilter || undefined,
      petType: petTypeFilter || undefined,
      inStock: stockFilter === 'in-stock' ? true : stockFilter === 'out-of-stock' ? false : undefined
    })
  });

  // Get out-of-stock products for notification bar
  const { data: outOfStockData } = useQuery({
    queryKey: ['products', 'out-of-stock-notification'],
    queryFn: () => adminService.getProducts({ inStock: false, limit: 100 })
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: adminService.getCategories
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteProduct,
    onSuccess: () => {
      // Invalidate all product-related queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Force refetch with current filters
      queryClient.refetchQueries({ 
        queryKey: ['products', page, searchQuery, categoryFilter, petTypeFilter, stockFilter] 
      });
      showToast('Product deleted successfully!', 'success');
    },
    onError: (error: any) => {
      console.error('Delete product error:', error);
      showToast(error?.response?.data?.message || 'Failed to delete product. Please try again.', 'error');
    }
  });

  const handleConfirmDelete = () => {
    if (deleteConfirm.productId) {
      // Ensure product ID is a string
      const productId = String(deleteConfirm.productId);
      deleteMutation.mutate(productId);
    }
    setDeleteConfirm({ isOpen: false });
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
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-white text-[#1E3A8A] px-6 py-3 rounded-xl hover:bg-blue-50 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 btn-ripple"
          >
            <Plus size={20} />
            Add Product
          </button>
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

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
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
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : productsData?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                productsData?.data.map((product: any) => (
                  <tr key={product._id} className="hover:bg-gray-50">
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
                ))
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
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirm.productName}"? This action cannot be undone and will permanently remove this product from the system.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isLoading={deleteMutation.isPending}
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




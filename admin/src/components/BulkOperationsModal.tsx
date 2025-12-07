import { useState } from 'react';
import { X, Package, Tag, CheckCircle, AlertCircle } from 'lucide-react';

interface BulkOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onBulkUpdate: (updates: any) => void;
  onBulkAssignCategory: (categoryId: string) => void;
  categories?: any[];
  isLoading?: boolean;
}

const BulkOperationsModal = ({
  isOpen,
  onClose,
  selectedCount,
  onBulkUpdate,
  onBulkAssignCategory,
  categories = [],
  isLoading = false
}: BulkOperationsModalProps) => {
  const [activeTab, setActiveTab] = useState<'update' | 'category'>('update');
  const [updates, setUpdates] = useState({
    isActive: '',
    isFeatured: '',
    inStock: '',
    basePrice: '',
    totalStock: ''
  });
  const [selectedCategory, setSelectedCategory] = useState('');

  if (!isOpen) return null;

  const handleUpdate = () => {
    const updateData: any = {};
    if (updates.isActive !== '') updateData.isActive = updates.isActive === 'true';
    if (updates.isFeatured !== '') updateData.isFeatured = updates.isFeatured === 'true';
    if (updates.inStock !== '') updateData.inStock = updates.inStock === 'true';
    if (updates.basePrice !== '') updateData.basePrice = parseFloat(updates.basePrice);
    if (updates.totalStock !== '') updateData.totalStock = parseInt(updates.totalStock);

    if (Object.keys(updateData).length === 0) {
      alert('Please select at least one field to update');
      return;
    }

    onBulkUpdate(updateData);
  };

  const handleAssignCategory = () => {
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }
    onBulkAssignCategory(selectedCategory);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Bulk Operations</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>{selectedCount}</strong> product{selectedCount > 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('update')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'update'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package size={18} />
                Update Products
              </div>
            </button>
            <button
              onClick={() => setActiveTab('category')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'category'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag size={18} />
                Assign Category
              </div>
            </button>
          </div>

          {/* Update Tab */}
          {activeTab === 'update' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active Status
                </label>
                <select
                  value={updates.isActive}
                  onChange={(e) => setUpdates({ ...updates, isActive: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No change</option>
                  <option value="true">Set as Active</option>
                  <option value="false">Set as Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Status
                </label>
                <select
                  value={updates.isFeatured}
                  onChange={(e) => setUpdates({ ...updates, isFeatured: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No change</option>
                  <option value="true">Set as Featured</option>
                  <option value="false">Remove Featured</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Status
                </label>
                <select
                  value={updates.inStock}
                  onChange={(e) => setUpdates({ ...updates, inStock: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No change</option>
                  <option value="true">Set as In Stock</option>
                  <option value="false">Set as Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={updates.basePrice}
                  onChange={(e) => setUpdates({ ...updates, basePrice: e.target.value })}
                  placeholder="Leave empty for no change"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Stock (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={updates.totalStock}
                  onChange={(e) => setUpdates({ ...updates, totalStock: e.target.value })}
                  placeholder="Leave empty for no change"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>Updating...</>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Update Selected Products
                  </>
                )}
              </button>
            </div>
          )}

          {/* Category Tab */}
          {activeTab === 'category' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-yellow-600 mt-0.5" size={18} />
                  <p className="text-sm text-yellow-900">
                    This will assign the selected category to all {selectedCount} selected products.
                  </p>
                </div>
              </div>

              <button
                onClick={handleAssignCategory}
                disabled={isLoading || !selectedCategory}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>Assigning...</>
                ) : (
                  <>
                    <Tag size={18} />
                    Assign Category to Selected Products
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkOperationsModal;


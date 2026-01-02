import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Save, ChevronRight, ChevronDown, FolderTree } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  petType: string;
  isActive: boolean;
  parentCategory?: any;
  subcategories?: Category[];
}

const CategoriesNew = () => {
  const { toast, showToast, hideToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    petType: 'all' as string,
    parentCategory: '' as string,
    isActive: true
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    categoryId?: string;
    categoryName?: string;
  }>({ isOpen: false });

  // Fetch hierarchical categories
  const { data: categoriesResponse, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      // Phase 2: Cookie-Only - Use api service which handles cookies automatically
      const response = await api.get('/categories/admin/all');
      return response.data;
    }
  });

  const categories = categoriesResponse?.data || [];

  // Auto-refresh hook - automatically refreshes queries after mutations
  const { onMutationSuccess, onMutationError } = useAutoRefresh(
    ['admin-categories', 'categories'],
    { showToast }
  );

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      petType: 'all',
      parentCategory: '',
      isActive: true
    });
  };

  // Get flat list of all categories for parent selection
  const flatCategories = () => {
    const flat: Category[] = [];
    const flatten = (cats: Category[], level = 0) => {
      cats.forEach(cat => {
        flat.push({ ...cat, level } as any);
        if (cat.subcategories && cat.subcategories.length > 0) {
          flatten(cat.subcategories, level + 1);
        }
      });
    };
    flatten(categories);
    return flat;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Phase 2: Cookie-Only - Use api service which handles cookies automatically
      const response = await api.post('/categories', data);
      return response.data;
    },
    onSuccess: onMutationSuccess('Category created successfully!', handleCloseModal),
    onError: onMutationError()
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Phase 2: Cookie-Only - Use api service which handles cookies automatically
      const response = await api.put(`/categories/${id}`, data);
      return response.data;
    },
    onSuccess: onMutationSuccess('Category updated successfully!', handleCloseModal),
    onError: onMutationError()
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Ensure ID is a string and valid ObjectId format
      const categoryId = String(id || '').trim();
      if (!/^[0-9a-fA-F]{24}$/.test(categoryId)) {
        throw new Error('Invalid category ID format');
      }
      
      // Phase 2: Cookie-Only - Use api service which handles cookies automatically
      const response = await api.delete(`/categories/${encodeURIComponent(categoryId)}`);
      return response.data;
    },
    onSuccess: onMutationSuccess('Category deleted successfully!', () => {
      setDeleteConfirm({ isOpen: false });
    }),
    onError: (error: any) => {
      // Use safe error logging
      import('@/utils/safeLogger').then(({ safeError }) => {
        safeError('Category delete error', error);
      });
      showToast(error.message || 'Failed to delete category', 'error');
    }
  });

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      // Ensure categoryId is a string
      const id = String(categoryId || '');
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleOpenModal = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        petType: category.petType,
        parentCategory: category.parentCategory?._id ? String(category.parentCategory._id) : '',
        isActive: category.isActive
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        petType: 'all',
        parentCategory: '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      parentCategory: formData.parentCategory || null
    };

    if (editingCategory) {
      // Ensure _id is a string
      const categoryId = String(editingCategory._id || '');
      updateMutation.mutate({ id: categoryId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (category: any) => {
    // Ensure _id is a string
    const categoryId = String(category._id || '');
    setDeleteConfirm({
      isOpen: true,
      categoryId: categoryId,
      categoryName: category.name
    });
  };

  const confirmDelete = () => {
    if (deleteConfirm.categoryId) {
      // Ensure ID is a string before sending
      const categoryId = String(deleteConfirm.categoryId);
      deleteMutation.mutate(categoryId);
    }
  };

  const renderCategory = (category: Category, level = 0) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories.has(String(category._id || ''));

    return (
      <div key={String(category._id || '')}>
        {/* Main Category Row */}
        <div
          className={`flex items-center gap-3 p-4 bg-white border-b hover:bg-gray-50 transition-colors ${
            level > 0 ? 'ml-' + (level * 8) : ''
          }`}
          style={{ paddingLeft: `${level * 32 + 16}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasSubcategories ? (
            <button
              onClick={() => toggleExpand(String(category._id || ''))}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-gray-600" />
              ) : (
                <ChevronRight size={16} className="text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-6" /> 
          )}

          {/* Category Icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            level === 0 ? 'bg-primary-100' : 'bg-gray-100'
          }`}>
            {level === 0 ? '📁' : '📄'}
          </div>

          {/* Category Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              {level > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Subcategory
                </span>
              )}
              {!category.isActive && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  Inactive
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-gray-600 mt-1">{category.description}</p>
            )}
            {category.parentCategory && (
              <p className="text-xs text-gray-500 mt-1">
                Parent: {category.parentCategory.name}
              </p>
            )}
          </div>

          {/* Pet Type */}
          <div className="text-sm">
            <span className={`px-3 py-1 rounded-full text-white font-medium ${
              category.petType === 'dog' ? 'bg-blue-500' :
              category.petType === 'cat' ? 'bg-purple-500' :
              'bg-gray-500'
            }`}>
              {category.petType === 'dog' ? '🐕 Dog' :
               category.petType === 'cat' ? '🐈 Cat' :
               '🐾 All Pets'}
            </span>
          </div>

          {/* Subcategory Count */}
          {hasSubcategories && (
            <div className="text-sm text-gray-600">
              {category.subcategories!.length} {category.subcategories!.length === 1 ? 'subcategory' : 'subcategories'}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenModal(category)}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Edit Category"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => {
                setFormData({ ...formData, parentCategory: String(category._id || '') });
                handleOpenModal();
              }}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Add Subcategory"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => handleDelete(category)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Category"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Render Subcategories */}
        {hasSubcategories && isExpanded && (
          <div>
            {category.subcategories!.map(subcat => renderCategory(subcat, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toast toast={toast} onClose={hideToast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FolderTree size={32} className="text-primary-600" />
            Categories & Subcategories
          </h1>
          <p className="text-gray-600 mt-1">
            Organize your products with main categories and subcategories
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
        >
          <Plus size={20} />
          Add Main Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="text-blue-600 text-sm font-medium">Total Categories</div>
          <div className="text-3xl font-bold text-blue-900 mt-1">
            {categoriesResponse?.total || 0}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="text-green-600 text-sm font-medium">Main Categories</div>
          <div className="text-3xl font-bold text-green-900 mt-1">
            {categories.length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="text-purple-600 text-sm font-medium">Subcategories</div>
          <div className="text-3xl font-bold text-purple-900 mt-1">
            {(categoriesResponse?.total || 0) - categories.length}
          </div>
        </div>
      </div>

      {/* Categories Tree */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {categories.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FolderTree size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No categories yet</p>
            <p className="text-sm mt-2">Create your first category to get started</p>
          </div>
        ) : (
          <div>
            {categories.map((category: Category) => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Parent Category Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Category (Optional)
                </label>
                <select
                  value={formData.parentCategory}
                  onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">None (Main Category)</option>
                  {flatCategories()
                    .filter(cat => editingCategory ? String(cat._id || '') !== String(editingCategory._id || '') : true)
                    .map((cat: any) => (
                      <option key={cat._id} value={String(cat._id)}>
                        {'—'.repeat(cat.level || 0)} {cat.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to create a main category, or select a parent to create a subcategory
                </p>
              </div>

              {/* Category Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Food, Toys, Accessories"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Brief description of this category"
                />
              </div>

              {/* Pet Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pet Type *
                </label>
                <select
                  required
                  value={formData.petType}
                  onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Pets</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                </select>
              </div>

              {/* Active Status */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active (visible to customers)
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteConfirm.categoryName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isLoading={deleteMutation.isPending}
        icon={
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="text-red-600" size={32} />
          </div>
        }
      />
    </div>
  );
};

export default CategoriesNew;


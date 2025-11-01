import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Save, ChevronRight, ChevronDown, FolderTree } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { adminService } from '@/services/adminService';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  petType: string;
  isActive: boolean;
  level: number;
  parentCategory?: any;
  subcategories?: Category[];
}

const CategoriesNew = () => {
  const queryClient = useQueryClient();
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
  const [showGuide, setShowGuide] = useState(true);

  // Fetch hierarchical categories
  const { data: categoriesResponse, isLoading, error } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminService.getAllCategoriesAdmin,
    retry: 2
  });

  // Fetch pet types
  const { data: petTypesResponse } = useQuery({
    queryKey: ['pet-types'],
    queryFn: adminService.getPetTypes,
    retry: 2
  });

  const categories = categoriesResponse?.data || [];
  
  // Debug logging
  if (categoriesResponse) {
    console.log('Categories Response:', {
      hasData: !!categoriesResponse.data,
      dataLength: categoriesResponse.data?.length,
      total: categoriesResponse.total,
      categories: categoriesResponse.data
    });
  }
  
  if (error) {
    console.error('Error fetching categories:', error);
  }

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
    mutationFn: adminService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast('Category created successfully!', 'success');
      handleCloseModal();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create category', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast('Category updated successfully!', 'success');
      handleCloseModal();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update category', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast('Category deleted successfully!', 'success');
      setDeleteConfirm({ isOpen: false });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete category', 'error');
    }
  });

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleOpenModal = (category?: any, parentCategoryId?: string) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        petType: category.petType,
        parentCategory: category.parentCategory?._id || '',
        isActive: category.isActive
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        petType: 'all',
        parentCategory: parentCategoryId || '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleAddSubcategory = (parentCategory: any) => {
    // Pre-fill with parent's pet type
    setFormData({
      name: '',
      description: '',
      petType: parentCategory.petType, // Inherit from parent
      parentCategory: parentCategory._id,
      isActive: true
    });
    setEditingCategory(null);
    setShowModal(true);
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      parentCategory: formData.parentCategory || null
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (category: any) => {
    setDeleteConfirm({
      isOpen: true,
      categoryId: category._id,
      categoryName: category.name
    });
  };

  const confirmDelete = () => {
    if (deleteConfirm.categoryId) {
      deleteMutation.mutate(deleteConfirm.categoryId);
    }
  };

  const renderCategory = (category: Category, level = 0) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories.has(category._id);

    return (
      <div key={category._id}>
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
              onClick={() => toggleExpand(category._id)}
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
            level === 0 ? 'bg-primary-100' : 
            level === 1 ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            {level === 0 ? '📁' : level === 1 ? '📂' : '📄'}
          </div>

          {/* Category Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              {level === 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                  Main Category
                </span>
              )}
              {level === 1 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                  Subcategory
                </span>
              )}
              {level === 2 && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                  Sub-Subcategory
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
            {/* Show Add Sub button if category level is less than 3 (max depth) */}
            {category.level < 3 && (
              <button
                onClick={() => handleAddSubcategory(category)}
                className="flex items-center gap-1 px-3 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                title="Add Subcategory"
              >
                <Plus size={16} />
                <span className="text-xs font-medium">Add Sub</span>
              </button>
            )}
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

      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 lg:p-8 shadow-xl mb-6 animate-fade-in-up">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
              <FolderTree size={36} className="text-white" />
              Navigation Menu - Categories
            </h1>
            <p className="text-blue-100 text-lg">
              Manage navigation menu structure: Main Categories → Subcategories → Sub-Subcategories (3 levels max)
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-white text-[#1E3A8A] px-6 py-3 rounded-xl hover:bg-blue-50 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 btn-ripple z-10 relative"
          >
            <Plus size={20} />
            Add Main Category
          </button>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300 opacity-10 rounded-full blur-3xl"></div>
      </div>

        {/* Quick Guide */}
        {showGuide && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 mt-0.5 flex-shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-blue-900">Category Structure (Up to 3 Levels):</h3>
                  <button
                    onClick={() => setShowGuide(false)}
                    className="text-blue-400 hover:text-blue-600 transition-colors -mt-1"
                    title="Dismiss guide"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="text-sm text-blue-800 space-y-1.5">
                  <p><strong>📂 Level 1 - Main Categories:</strong> Create with "Add Main Category" button. These can have subcategories.</p>
                  <p><strong>📄 Level 2 - Subcategories:</strong> Click the green <span className="inline-flex items-center px-2 py-0.5 bg-green-600 text-white text-xs rounded font-medium">+ Add Sub</span> button on any category to add a subcategory under it.</p>
                  <p><strong>📄 Level 3 - Sub-subcategories:</strong> Click <span className="inline-flex items-center px-2 py-0.5 bg-green-600 text-white text-xs rounded font-medium">+ Add Sub</span> on a subcategory to create deeper nesting (maximum 3 levels total).</p>
                  <p className="mt-2 pt-2 border-t border-blue-200 text-blue-700"><strong>🐾 "Other Animals" Special:</strong> For the "Other Animals" pet type, create main categories for each animal type (e.g., "Hamster", "Rabbit", "Guinea Pig"). These will appear as individual animal types in the website menu!</p>
                  <p className="text-blue-700">💡 <strong>Tip:</strong> Click the arrow (▶) to expand/collapse categories with subcategories.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Show Guide Button (when dismissed) */}
        {!showGuide && (
          <button
            onClick={() => setShowGuide(true)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Show guide
          </button>
        )}
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
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading categories...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            <p className="text-lg font-medium">Error loading categories</p>
            <p className="text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        ) : categories.length === 0 ? (
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
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCategory 
                    ? 'Edit Category' 
                    : formData.parentCategory 
                      ? 'Create Subcategory' 
                      : 'Create Main Category'}
                </h2>
                {!editingCategory && formData.parentCategory && (() => {
                  const parentCat = flatCategories().find((c: any) => c._id === formData.parentCategory);
                  return parentCat ? (
                    <p className="text-sm text-gray-600 mt-1">
                      Adding subcategory under: <span className="font-semibold text-green-600">{parentCat.name}</span>
                    </p>
                  ) : null;
                })()}
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Parent Category Selection */}
              {!editingCategory && (
                <div className={`mb-4 ${formData.parentCategory ? 'bg-green-50 border border-green-200 rounded-lg p-3' : ''}`}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Category {formData.parentCategory && <span className="text-green-600">(Subcategory Mode)</span>}
                  </label>
                  <select
                    value={formData.parentCategory}
                    onChange={(e) => {
                      const selectedParentId = e.target.value;
                      if (selectedParentId) {
                        // Find parent category and inherit its pet type
                        const parentCat = flatCategories().find((c: any) => c._id === selectedParentId);
                        if (parentCat) {
                          setFormData({ 
                            ...formData, 
                            parentCategory: selectedParentId,
                            petType: parentCat.petType // Auto-inherit pet type
                          });
                        }
                      } else {
                        // Reset to default when no parent selected
                        setFormData({ ...formData, parentCategory: '', petType: 'all' });
                      }
                    }}
                    className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${
                      formData.parentCategory 
                        ? 'border-green-300 focus:ring-green-500 bg-white' 
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                  >
                    <option value="">None (Main Category)</option>
                    {flatCategories()
                      .filter(cat => {
                        // Only show categories that can have children (level < 3)
                        const canHaveChildren = cat.level < 3;
                        const isNotEditingCategory = editingCategory ? cat._id !== editingCategory._id : true;
                        return canHaveChildren && isNotEditingCategory;
                      })
                      .map((cat: any) => (
                        <option key={cat._id} value={cat._id}>
                          {'  '.repeat(cat.level || 0)}{cat.name} {cat.level === 2 ? '(Level 3 - Max)' : cat.level === 1 ? '(Level 2)' : ''}
                        </option>
                      ))}
                  </select>
                  <p className={`text-xs mt-1 ${formData.parentCategory ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                    {formData.parentCategory 
                      ? 'This category will be created as a subcategory of the selected parent' 
                      : 'Leave empty to create a main category, or select a parent to create a subcategory'}
                  </p>
                </div>
              )}

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
                  Pet Type * {!editingCategory && formData.parentCategory && (
                    <span className="text-green-600 text-xs font-normal">(Inherited from parent)</span>
                  )}
                </label>
                <select
                  required
                  value={formData.petType}
                  onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                  disabled={!editingCategory && !!formData.parentCategory}
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${
                    !editingCategory && formData.parentCategory
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-700'
                      : 'border-gray-300 focus:ring-primary-500'
                  }`}
                >
                  <option value="all">All Pets</option>
                  {petTypesResponse?.data?.map((petType: any) => (
                    <option key={petType.slug} value={petType.slug}>
                      {petType.icon} {petType.name}
                    </option>
                  ))}
                </select>
                {!editingCategory && formData.parentCategory && (
                  <p className="text-xs text-green-600 mt-1">
                    Subcategories automatically inherit the pet type from their parent category
                  </p>
                )}
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


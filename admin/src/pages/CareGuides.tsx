import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { Plus, Edit, Trash2, Search, Eye, EyeOff, BookOpen, Calendar, Upload, Link2, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import Dropdown from '@/components/Dropdown';
import { normalizeImageUrl } from '@/utils/imageUtils';
import { CareGuide, CareGuideFormData, CareGuideCategory } from '@/types/careGuide';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

// Helper function to safely convert any ID to a unique string key
const getUniqueKey = (id: unknown, index: number, prefix: string = 'item'): string => {
  if (!id && id !== 0) {
    return `${prefix}-${index}`;
  }
  if (typeof id === 'string') {
    return `${id}-${index}`;
  }
  if (typeof id === 'number') {
    return `${id}-${index}`;
  }
  if (typeof id === 'object') {
    if (id.toString && typeof id.toString === 'function') {
      try {
        const str = id.toString();
        if (str && str !== '[object Object]') {
          return `${str}-${index}`;
        }
      } catch (e) {}
    }
    if (id.valueOf && typeof id.valueOf === 'function') {
      try {
        const val = id.valueOf();
        if (val && val !== id) {
          return getUniqueKey(val, index, prefix);
        }
      } catch (e) {}
    }
    try {
      const json = JSON.stringify(id);
      if (json && json !== '{}' && json !== 'null') {
        return `${json}-${index}`;
      }
    } catch (e) {}
  }
  return `${prefix}-${index}`;
};

const CareGuides = () => {
  const { toast, showToast, hideToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingGuide, setEditingGuide] = useState<CareGuide | null>(null);
  const [petTypeFilter, setPetTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [isPublishedFilter, setIsPublishedFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    guideId?: string;
    guideTitle?: string;
  }>({ isOpen: false });

  // Fetch care guides
  const { data: guidesData, isLoading } = useQuery({
    queryKey: ['care-guides', 'admin', page, searchQuery, petTypeFilter, categoryFilter, difficultyFilter, isPublishedFilter],
    queryFn: () => adminService.getCareGuides({
      page,
      limit: 20,
      search: searchQuery || undefined,
      petType: petTypeFilter || undefined,
      category: categoryFilter || undefined,
      difficulty: difficultyFilter || undefined,
      isPublished: isPublishedFilter ? isPublishedFilter === 'true' : undefined
    }),
    retry: false
  });

  // Fetch pet types for filter
  const { data: petTypesData } = useQuery({
    queryKey: ['pet-types'],
    queryFn: adminService.getPetTypes,
    retry: false
  });

  // Fetch care guide categories
  const { data: categoriesData } = useQuery({
    queryKey: ['care-guide-categories', petTypeFilter],
    queryFn: () => adminService.getCareGuideCategories(petTypeFilter || undefined),
    retry: false
  });

  // Auto-refresh hook - automatically refreshes queries after mutations
  const { onMutationSuccess, onMutationError } = useAutoRefresh(
    ['care-guides', 'care-guide-categories'],
    { showToast }
  );

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGuide(null);
  };

  // Create care guide mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => adminService.createCareGuide(data),
    onSuccess: onMutationSuccess('Care guide created successfully!', handleCloseModal),
    onError: onMutationError()
  });

  // Update care guide mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateCareGuide(id, data),
    onSuccess: onMutationSuccess('Care guide updated successfully!', handleCloseModal),
    onError: onMutationError()
  });

  // Delete care guide mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCareGuide(id),
    onSuccess: onMutationSuccess('Care guide deleted successfully!', () => {
      setDeleteConfirm({ isOpen: false });
    }),
    onError: onMutationError()
  });

  const handleEdit = (guide: CareGuide) => {
    setEditingGuide(guide);
    setShowModal(true);
  };

  const handleDelete = (guide: CareGuide) => {
    setDeleteConfirm({
      isOpen: true,
      guideId: guide._id,
      guideTitle: guide.title
    });
  };

  const handleSubmit = (data: CareGuideFormData & { tags: string[] }) => {
    if (editingGuide) {
      updateMutation.mutate({ id: editingGuide._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return <TrendingDown size={14} className="text-green-600" />;
      case 'intermediate':
        return <Minus size={14} className="text-yellow-600" />;
      case 'advanced':
        return <TrendingUp size={14} className="text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Care Guides</h1>
          <p className="text-gray-600 mt-1">Manage pet care guides and educational content</p>
        </div>
        <button
          onClick={() => {
            setEditingGuide(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Care Guide
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search care guides..."
              value={searchQuery || ''}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <Dropdown
            options={[
              { value: '', label: 'All Pet Types' },
              ...(petTypesData?.data || []).map((pt: { _id: string; slug: string; name: string }) => ({
                value: pt.slug,
                label: pt.name
              }))
            ]}
            value={petTypeFilter}
            onChange={(value) => {
              setPetTypeFilter(value);
              setPage(1);
            }}
            placeholder="Filter by Pet Type"
          />

          <Dropdown
            options={[
              { value: '', label: 'All Categories' },
              ...(categoriesData?.data || []).map((cat: CareGuideCategory) => ({
                value: cat.name,
                label: `${cat.name} (${cat.count})`
              }))
            ]}
            value={categoryFilter}
            onChange={(value) => {
              setCategoryFilter(value);
              setPage(1);
            }}
            placeholder="Filter by Category"
          />

          <Dropdown
            options={[
              { value: '', label: 'All Difficulty' },
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' }
            ]}
            value={difficultyFilter}
            onChange={(value) => {
              setDifficultyFilter(value);
              setPage(1);
            }}
            placeholder="Filter by Difficulty"
          />

          <Dropdown
            options={[
              { value: '', label: 'All Status' },
              { value: 'true', label: 'Published' },
              { value: 'false', label: 'Draft' }
            ]}
            value={isPublishedFilter}
            onChange={(value) => {
              setIsPublishedFilter(value);
              setPage(1);
            }}
            placeholder="Filter by Status"
          />
        </div>
      </div>

      {/* Care Guides List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading care guides...</p>
        </div>
      ) : !guidesData?.data || guidesData.data.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-lg font-medium text-gray-600">No care guides found</p>
          <p className="text-sm text-gray-500 mt-2">
            {searchQuery || petTypeFilter || categoryFilter
              ? 'Try adjusting your filters'
              : 'Create your first care guide to get started'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {guidesData.data.map((guide: CareGuide, index: number) => (
                    <tr key={getUniqueKey(guide._id, index, 'guide')} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {guide.featuredImage && (
                            <img
                              src={normalizeImageUrl(guide.featuredImage)}
                              alt={guide.title}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{guide.title}</div>
                            {guide.excerpt && (
                              <div className="text-xs text-gray-500 mt-1">{truncateText(guide.excerpt, 60)}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{guide.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 capitalize">{guide.petType || 'All'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {guide.difficulty && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {getDifficultyIcon(guide.difficulty)}
                            {guide.difficulty}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {guide.isPublished ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Eye size={12} />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <EyeOff size={12} />
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          {guide.publishedAt ? formatDate(guide.publishedAt) : formatDate(guide.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{guide.views || 0}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(guide)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                            title="Edit care guide"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(guide)}
                            className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                            title="Delete care guide"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {guidesData.pagination && guidesData.pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {guidesData.pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(guidesData.pagination.pages, p + 1))}
                disabled={page >= guidesData.pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Care Guide Form Modal */}
      {showModal && (
        <CareGuideFormModal
          guide={editingGuide}
          onClose={() => {
            setShowModal(false);
            setEditingGuide(null);
          }}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={() => {
          if (deleteConfirm.guideId) {
            deleteMutation.mutate(deleteConfirm.guideId);
          }
        }}
        title="Delete Care Guide"
        message={
          <>
            Are you sure you want to delete the care guide <strong>{deleteConfirm.guideTitle}</strong>?
            <br />
            <span className="text-red-600 font-semibold">This action cannot be undone.</span>
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {toast.isVisible && <Toast toast={toast} onClose={hideToast} />}
    </div>
  );
};

// Care Guide Form Modal Component
interface CareGuideFormModalProps {
  guide: CareGuide | null;
  onClose: () => void;
  onSubmit: (data: CareGuideFormData & { tags: string[] }) => void;
  isLoading: boolean;
}

const CareGuideFormModal = ({ guide, onClose, onSubmit, isLoading }: CareGuideFormModalProps) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<CareGuideFormData>({
    title: guide?.title || '',
    content: guide?.content || '',
    excerpt: guide?.excerpt || '',
    featuredImage: guide?.featuredImage || '',
    petType: guide?.petType || 'all',
    category: guide?.category || '',
    tags: guide?.tags?.join(', ') || '',
    isPublished: guide?.isPublished || false,
    difficulty: guide?.difficulty || 'beginner',
    sections: guide?.sections || [],
    relatedProducts: guide?.relatedProducts?.map(p => p._id) || [],
    metaTitle: guide?.metaTitle || '',
    metaDescription: guide?.metaDescription || ''
  });
  const [imageInputMode, setImageInputMode] = useState<'url' | 'upload'>(guide?.featuredImage ? 'url' : 'url');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(guide?.featuredImage || null);

  useEffect(() => {
    if (guide?.featuredImage) {
      setImagePreview(guide.featuredImage);
      setFormData((prev) => ({ ...prev, featuredImage: guide.featuredImage || '' }));
    } else {
      setImagePreview(null);
      setFormData((prev) => ({ ...prev, featuredImage: '' }));
    }
  }, [guide]);

  const { data: petTypesData } = useQuery({
    queryKey: ['pet-types'],
    queryFn: adminService.getPetTypes,
    retry: false
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['care-guide-categories', formData.petType],
    queryFn: () => adminService.getCareGuideCategories(formData.petType !== 'all' ? formData.petType : undefined),
    retry: false
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Please upload a valid image file (JPEG, PNG, GIF, or WebP)', 'error');
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('Image size must be less than 5MB', 'error');
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    setUploading(true);
    try {
      const result = await adminService.uploadImage(file);
      let imageUrl = null;
      if (typeof result === 'string') {
        imageUrl = result;
      } else if (result?.url) {
        imageUrl = result.url;
      } else if (result?.secure_url) {
        imageUrl = result.secure_url;
      } else if (result?.data?.url) {
        imageUrl = result.data.url;
      }
      
      if (!imageUrl) {
        throw new Error('No image URL returned from server');
      }
      
      imageUrl = String(imageUrl).trim();
      setFormData({ ...formData, featuredImage: imageUrl });
      setImagePreview(imageUrl);
      showToast('Image uploaded successfully!', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleAddSection = () => {
    setFormData({
      ...formData,
      sections: [...(formData.sections || []), { title: '', content: '', order: formData.sections?.length || 0 }]
    });
  };

  const handleRemoveSection = (index: number) => {
    setFormData({
      ...formData,
      sections: formData.sections?.filter((_, i) => i !== index) || []
    });
  };

  const handleSectionChange = (index: number, field: 'title' | 'content', value: string) => {
    const newSections = [...(formData.sections || [])];
    newSections[index] = { ...newSections[index], [field]: value };
    setFormData({ ...formData, sections: newSections });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    onSubmit({
      ...formData,
      tags: tagsArray
    } as CareGuideFormData & { tags: string[] });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {guide ? 'Edit Care Guide' : 'Create New Care Guide'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Care guide title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Feeding, Grooming, Health"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {(categoriesData?.data || []).map((cat: CareGuideCategory) => (
                  <option key={cat.name} value={cat.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Pet Type</label>
              <select
                value={formData.petType}
                onChange={(e) => setFormData({ ...formData, petType: e.target.value, category: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Pets</option>
                {(petTypesData?.data || []).map((pt: { _id: string; slug: string; name: string }) => (
                  <option key={pt._id} value={pt.slug}>{pt.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Featured Image</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    imageInputMode === 'url'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Link2 size={16} />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    imageInputMode === 'upload'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Upload size={16} />
                  Upload
                </button>
              </div>

              {imageInputMode === 'url' && (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={formData.featuredImage}
                    onChange={(e) => {
                      setFormData({ ...formData, featuredImage: e.target.value });
                      setImagePreview(e.target.value || null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={normalizeImageUrl(imagePreview)}
                        alt="Preview"
                        className="h-32 w-auto rounded-lg border border-gray-300"
                        onError={() => setImagePreview(null)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, featuredImage: '' });
                          setImagePreview(null);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {imageInputMode === 'upload' && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                    <Upload size={16} />
                    {uploading ? 'Uploading...' : 'Choose Image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={normalizeImageUrl(imagePreview)}
                        alt="Preview"
                        className="h-32 w-auto rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, featuredImage: '' });
                          setImagePreview(null);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Short description (max 500 characters)"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.excerpt.length}/500</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content *</label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={10}
              placeholder="Care guide content (HTML supported)"
            />
          </div>

          {/* Sections */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Sections (Optional)</label>
              <button
                type="button"
                onClick={handleAddSection}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Section
              </button>
            </div>
            {formData.sections && formData.sections.length > 0 && (
              <div className="space-y-4">
                {formData.sections.map((section, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Section {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Section title"
                    />
                    <textarea
                      value={section.content}
                      onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Section content"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="feeding, grooming, health"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Meta Title (SEO)</label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="SEO title (max 60 characters)"
                maxLength={60}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Meta Description (SEO)</label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="SEO description (max 160 characters)"
                maxLength={160}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
              Publish immediately
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : guide ? 'Update Care Guide' : 'Create Care Guide'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CareGuides;


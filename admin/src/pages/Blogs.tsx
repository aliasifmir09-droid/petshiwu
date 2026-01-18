import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { Plus, Edit, Trash2, Search, Eye, EyeOff, FileText, Calendar, User, Upload, Link2, X } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import Dropdown from '@/components/Dropdown';
import { normalizeImageUrl } from '@/utils/imageUtils';
import { Blog, BlogFormData, BlogCategory } from '@/types/blog';
import { useDebounce } from '@/hooks/useDebounce';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import RichTextEditor from '@/components/RichTextEditor';

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

const Blogs = () => {
  const { toast, showToast, hideToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300); // Debounce search input by 300ms
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [petTypeFilter, setPetTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isPublishedFilter, setIsPublishedFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    blogId?: string;
    blogTitle?: string;
  }>({ isOpen: false });

  // Fetch blogs
  // CRITICAL: Set staleTime to 0 and refetchOnMount to ensure immediate updates after mutations
  const { data: blogsData, isLoading } = useQuery({
    queryKey: ['blogs', 'admin', page, debouncedSearch, petTypeFilter, categoryFilter, isPublishedFilter],
    queryFn: () => adminService.getBlogs({
      page,
      limit: 20,
      search: debouncedSearch || undefined,
      petType: petTypeFilter || undefined,
      category: categoryFilter || undefined,
      isPublished: isPublishedFilter ? isPublishedFilter === 'true' : undefined
    }),
    retry: false,
    staleTime: 0, // Always consider data stale - refetch immediately when invalidated
    refetchOnMount: true, // Always refetch when component mounts
    gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes for garbage collection
  });

  // Fetch pet types for filter
  const { data: petTypesData } = useQuery({
    queryKey: ['pet-types'],
    queryFn: adminService.getPetTypes,
    retry: false,
    staleTime: 0, // Always consider data stale - refetch immediately when invalidated
    refetchOnMount: true // Always refetch when component mounts
  });

  // Fetch blog categories
  const { data: categoriesData } = useQuery({
    queryKey: ['blog-categories', petTypeFilter],
    queryFn: () => adminService.getBlogCategories(petTypeFilter || undefined),
    retry: false,
    staleTime: 0, // Always consider data stale - refetch immediately when invalidated
    refetchOnMount: true // Always refetch when component mounts
  });

  // Auto-refresh hook - automatically refreshes queries after mutations
  const { onMutationSuccess, onMutationError } = useAutoRefresh(
    ['blogs', 'blog-categories'],
    { showToast }
  );

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBlog(null);
  };

  // Create blog mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => adminService.createBlog(data),
    onSuccess: onMutationSuccess('Blog created successfully!', handleCloseModal),
    onError: onMutationError()
  });

  // Update blog mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateBlog(id, data),
    onSuccess: onMutationSuccess('Blog updated successfully!', handleCloseModal),
    onError: onMutationError()
  });

  // Delete blog mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteBlog(id),
    onSuccess: onMutationSuccess('Blog deleted successfully!', () => {
      setDeleteConfirm({ isOpen: false });
    }),
    onError: onMutationError()
  });

  const handleEdit = async (blog: any) => {
    try {
      const blogData = await adminService.getBlogById(blog._id);
      setEditingBlog(blogData.data);
      setShowModal(true);
    } catch (error: any) {
      showToast('Failed to load blog data', 'error');
    }
  };

  const handleDelete = (blog: any) => {
    setDeleteConfirm({
      isOpen: true,
      blogId: blog._id,
      blogTitle: blog.title
    });
  };

  const handleSubmit = (formData: BlogFormData & { tags: string[] }) => {
    // Tags are already converted to array by BlogFormModal
    if (editingBlog) {
      updateMutation.mutate({ id: editingBlog._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={hideToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600 mt-1">Create and manage blog posts for the Learning Center</p>
        </div>
        <button
          onClick={() => {
            setEditingBlog(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          Add New Blog
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search blogs..."
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
              ...(categoriesData?.data || []).map((cat: BlogCategory) => ({
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

      {/* Blogs List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blogs...</p>
        </div>
      ) : !blogsData?.data || blogsData.data.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-lg font-medium text-gray-600">No blogs found</p>
          <p className="text-sm text-gray-500 mt-2">
            {searchQuery || petTypeFilter || categoryFilter
              ? 'Try adjusting your filters'
              : 'Create your first blog post to get started'}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blogsData.data.map((blog: Blog, index: number) => (
                    <tr key={getUniqueKey(blog._id, index, 'blog')} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {blog.featuredImage && (
                            <img
                              src={blog.featuredImage}
                              alt={blog.title}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                            {blog.excerpt && (
                              <div className="text-xs text-gray-500 mt-1">{truncateText(blog.excerpt, 60)}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{blog.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 capitalize">{blog.petType || 'All'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {blog.author?.name || blog.author?.email || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {blog.isPublished ? (
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
                          {blog.publishedAt ? formatDate(blog.publishedAt) : formatDate(blog.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{blog.views || 0}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(blog)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                            title="Edit blog"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(blog)}
                            className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                            title="Delete blog"
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
          {blogsData.pagination && blogsData.pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {blogsData.pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(blogsData.pagination.pages, p + 1))}
                disabled={page === blogsData.pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Blog Form Modal */}
      {showModal && (
        <BlogFormModal
          blog={editingBlog}
          onClose={() => {
            setShowModal(false);
            setEditingBlog(null);
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
          if (deleteConfirm.blogId) {
            deleteMutation.mutate(deleteConfirm.blogId);
          }
        }}
        title="Delete Blog"
        message={
          <>
            Are you sure you want to delete the blog <strong>{deleteConfirm.blogTitle}</strong>?
            <br />
            <span className="text-red-600 font-semibold">This action cannot be undone.</span>
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

// Blog Form Modal Component
interface BlogFormModalProps {
  blog: Blog | null;
  onClose: () => void;
  onSubmit: (data: BlogFormData & { tags: string[] }) => void;
  isLoading: boolean;
}

const BlogFormModal = ({ blog, onClose, onSubmit, isLoading }: BlogFormModalProps) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    title: blog?.title || '',
    content: blog?.content || '',
    excerpt: blog?.excerpt || '',
    featuredImage: blog?.featuredImage || '',
    petType: blog?.petType || 'all',
    category: blog?.category || '',
    tags: blog?.tags?.join(', ') || '',
    isPublished: blog?.isPublished || false,
    metaTitle: blog?.metaTitle || '',
    metaDescription: blog?.metaDescription || ''
  });
  const [imageInputMode, setImageInputMode] = useState<'url' | 'upload'>(blog?.featuredImage ? 'url' : 'url');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(blog?.featuredImage || null);

  // Initialize image preview when blog changes
  useEffect(() => {
    if (blog?.featuredImage) {
      setImagePreview(blog.featuredImage);
      setFormData((prev: BlogFormData) => ({ ...prev, featuredImage: blog.featuredImage || '' }));
    } else {
      setImagePreview(null);
      setFormData((prev: BlogFormData) => ({ ...prev, featuredImage: '' }));
    }
  }, [blog]);

  const { data: petTypesData } = useQuery({
    queryKey: ['pet-types'],
    queryFn: adminService.getPetTypes,
    retry: false
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['blog-categories', formData.petType],
    queryFn: () => adminService.getBlogCategories(formData.petType !== 'all' ? formData.petType : undefined),
    retry: false
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Please upload a valid image file (JPEG, PNG, GIF, or WebP)', 'error');
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
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
      
      // Extract URL from response
      let imageUrl = null;
      if (typeof result === 'string') {
        imageUrl = result;
      } else if (result?.url) {
        imageUrl = result.url;
      } else if (result?.path) {
        imageUrl = result.path;
      } else if (result?.secure_url) {
        imageUrl = result.secure_url;
      } else if (result?.data?.url) {
        imageUrl = result.data.url;
      } else if (result?.data?.path) {
        imageUrl = result.data.path;
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

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, featuredImage: url });
    setImagePreview(url || null);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, featuredImage: '' });
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.content || formData.content.trim() === '' || formData.content === '<br>' || formData.content === '<div><br></div>') {
      showToast('Content is required', 'error');
      return;
    }
    
    // Convert tags string to array for API submission
    const tagsArray = formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    onSubmit({
      ...formData,
      tags: tagsArray
    } as BlogFormData & { tags: string[] });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {blog ? 'Edit Blog' : 'Create New Blog'}
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
                placeholder="Blog title"
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
                placeholder="e.g., Dog Care, Cat Care, New Pet"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {(categoriesData?.data || []).map((cat: BlogCategory) => (
                  <option key={cat.name} value={cat.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-2">Featured Image</label>
              
              {/* Image Input Mode Toggle */}
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

              {/* URL Input Mode */}
              {imageInputMode === 'url' && (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={formData.featuredImage}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
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
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Mode */}
              {imageInputMode === 'upload' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
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
                    {uploading && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Uploading...
                      </div>
                    )}
                  </div>
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
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
                  </p>
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
              placeholder="Short description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content *</label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="winter, safety, dog care"
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
                placeholder="SEO title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Meta Description (SEO)</label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="SEO description"
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
              {isLoading ? 'Saving...' : blog ? 'Update Blog' : 'Create Blog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Blogs;


import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Upload, Link2 } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { normalizeImageUrl } from '@/utils/imageUtils';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

interface Slide {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  backgroundColor?: string;
  theme: 'holiday' | 'product' | 'wellness' | 'treats' | 'custom';
  isActive: boolean;
  order: number;
}

const Slideshow = () => {
  const { toast, showToast, hideToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    slideId?: string;
    slideTitle?: string;
  }>({ isOpen: false });

  // Fetch slides
  // CRITICAL: Set staleTime to 0 and refetchOnMount to ensure immediate updates after mutations
  const { data: slides, isLoading } = useQuery({
    queryKey: ['slideshow'],
    queryFn: adminService.getSlides,
    retry: false,
    staleTime: 0, // Always consider data stale - refetch immediately when invalidated
    refetchOnMount: true, // Always refetch when component mounts
    gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes for garbage collection
  });

  // Auto-refresh hook - automatically refreshes queries after mutations
  const { onMutationSuccess, onMutationError } = useAutoRefresh(
    ['slideshow'],
    { showToast }
  );

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSlide(null);
  };

  // Create slide mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => adminService.createSlide(data),
    onSuccess: onMutationSuccess('Slide created successfully', handleCloseModal),
    onError: onMutationError()
  });

  // Update slide mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateSlide(id, data),
    onSuccess: onMutationSuccess('Slide updated successfully', handleCloseModal),
    onError: onMutationError()
  });

  // Delete slide mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteSlide(id),
    onSuccess: onMutationSuccess('Slide deleted successfully', () => {
      setDeleteConfirm({ isOpen: false });
    }),
    onError: onMutationError()
  });

  // Reorder slides mutation
  const reorderMutation = useMutation({
    mutationFn: (slides: Array<{ id: string; order: number }>) => adminService.reorderSlides(slides),
    onSuccess: onMutationSuccess('Slides reordered successfully'),
    onError: onMutationError()
  });

  const handleCreate = () => {
    setEditingSlide(null);
    setShowModal(true);
  };

  const handleEdit = (slide: Slide) => {
    setEditingSlide(slide);
    setShowModal(true);
  };

  const handleDelete = (slide: Slide) => {
    setDeleteConfirm({
      isOpen: true,
      slideId: slide._id,
      slideTitle: slide.title
    });
  };

  const confirmDelete = () => {
    if (deleteConfirm.slideId) {
      deleteMutation.mutate(deleteConfirm.slideId);
    }
  };

  const handleSubmit = (formData: any) => {
    if (editingSlide) {
      updateMutation.mutate({ id: editingSlide._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (slide: Slide) => {
    updateMutation.mutate({
      id: slide._id,
      data: { isActive: !slide.isActive }
    });
  };

  const handleMoveUp = (index: number) => {
    if (!slides || index === 0) return;
    const newSlides = [...slides];
    [newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]];
    const reordered = newSlides.map((slide, idx) => ({
      id: slide._id,
      order: idx
    }));
    reorderMutation.mutate(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (!slides || index === slides.length - 1) return;
    const newSlides = [...slides];
    [newSlides[index], newSlides[index + 1]] = [newSlides[index + 1], newSlides[index]];
    const reordered = newSlides.map((slide, idx) => ({
      id: slide._id,
      order: idx
    }));
    reorderMutation.mutate(reordered);
  };

  // Seed slides mutation
  const seedMutation = useMutation({
    mutationFn: () => adminService.seedSlideshow(),
    onSuccess: onMutationSuccess('Dummy slides created successfully'),
    onError: onMutationError()
  });

  const sortedSlides = slides ? [...slides].sort((a, b) => a.order - b.order) : [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Slideshow Management</h1>
        <div className="flex gap-2">
          {(!slides || slides.length === 0) && (
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              {seedMutation.isPending ? 'Seeding...' : 'Add Dummy Data'}
            </button>
          )}
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Add New Slide
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading slides...</div>
      ) : sortedSlides.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No slides found. Create your first slide to get started.
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedSlides.map((slide, index) => (
            <div
              key={slide._id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Image Preview */}
                <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={normalizeImageUrl(slide.imageUrl)}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.png';
                    }}
                  />
                </div>

                {/* Slide Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{slide.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{slide.subtitle}</p>
                      <p className="text-xs text-gray-500 mb-2">{slide.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Button: {slide.buttonText}</span>
                        <span>•</span>
                        <span>Link: {slide.buttonLink}</span>
                        <span>•</span>
                        <span>Theme: {slide.theme}</span>
                        <span>•</span>
                        <span>Order: {slide.order}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(slide)}
                        className={`p-2 rounded-lg ${
                          slide.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={slide.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {slide.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button
                        onClick={() => handleEdit(slide)}
                        className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(slide)}
                        className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === sortedSlides.length - 1}
                    className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <SlideModal
          slide={editingSlide}
          onClose={() => {
            setShowModal(false);
            setEditingSlide(null);
          }}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Slide"
        message={`Are you sure you want to delete "${deleteConfirm.slideTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Toast */}
      {toast.isVisible && (
        <Toast
          toast={toast}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

// Slide Form Modal Component
interface SlideModalProps {
  slide: Slide | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const SlideModal = ({ slide, onClose, onSubmit, isLoading }: SlideModalProps) => {
  const { showToast } = useToast();
  const [imageInputMode, setImageInputMode] = useState<'url' | 'upload'>(slide?.imageUrl ? 'url' : 'url');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(slide?.imageUrl || null);

  const [formData, setFormData] = useState({
    title: slide?.title || '',
    subtitle: slide?.subtitle || '',
    description: slide?.description || '',
    buttonText: slide?.buttonText || '',
    buttonLink: slide?.buttonLink || '',
    imageUrl: slide?.imageUrl || '',
    backgroundColor: slide?.backgroundColor || 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
    theme: slide?.theme || 'product',
    isActive: slide?.isActive !== undefined ? slide.isActive : true,
    order: slide?.order ?? 0
  });

  // Update preview when formData.imageUrl changes
  useEffect(() => {
    if (formData.imageUrl) {
      setImagePreview(formData.imageUrl);
    }
  }, [formData.imageUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

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
      setFormData({ ...formData, imageUrl });
      setImagePreview(imageUrl);
      showToast('Image uploaded successfully!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {slide ? 'Edit Slide' : 'Create New Slide'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle *</label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text *</label>
              <input
                type="text"
                name="buttonText"
                value={formData.buttonText}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Link *</label>
              <input
                type="text"
                name="buttonLink"
                value={formData.buttonLink}
                onChange={handleChange}
                required
                placeholder="/products"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
            
            {/* Toggle between URL and Upload */}
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setImageInputMode('url')}
                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${
                  imageInputMode === 'url'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Link2 size={16} />
                URL
              </button>
              <button
                type="button"
                onClick={() => setImageInputMode('upload')}
                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${
                  imageInputMode === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Upload size={16} />
                Upload
              </button>
            </div>

            {imageInputMode === 'url' ? (
              <>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  required
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {uploading && (
                  <p className="mt-1 text-sm text-gray-500">Uploading image...</p>
                )}
              </div>
            )}

            {imagePreview && (
              <div className="mt-2 w-32 h-20 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={normalizeImageUrl(imagePreview)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                name="theme"
                value={formData.theme}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="product">Product</option>
                <option value="holiday">Holiday</option>
                <option value="wellness">Wellness</option>
                <option value="treats">Treats</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Color (CSS Class)</label>
            <input
              type="text"
              name="backgroundColor"
              value={formData.backgroundColor}
              onChange={handleChange}
              placeholder="bg-gradient-to-br from-blue-50 via-white to-purple-50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">Active (visible on homepage)</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : slide ? 'Update Slide' : 'Create Slide'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Slideshow;


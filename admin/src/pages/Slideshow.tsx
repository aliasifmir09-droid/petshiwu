import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { normalizeImageUrl } from '@/utils/imageUtils';

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
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    slideId?: string;
    slideTitle?: string;
  }>({ isOpen: false });

  // Fetch slides
  const { data: slides, isLoading } = useQuery({
    queryKey: ['slideshow'],
    queryFn: adminService.getSlides,
    retry: false
  });

  // Create slide mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => adminService.createSlide(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slideshow'] });
      showToast('Slide created successfully', 'success');
      setShowModal(false);
      setEditingSlide(null);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create slide', 'error');
    }
  });

  // Update slide mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateSlide(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slideshow'] });
      showToast('Slide updated successfully', 'success');
      setShowModal(false);
      setEditingSlide(null);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update slide', 'error');
    }
  });

  // Delete slide mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteSlide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slideshow'] });
      showToast('Slide deleted successfully', 'success');
      setDeleteConfirm({ isOpen: false });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete slide', 'error');
    }
  });

  // Reorder slides mutation
  const reorderMutation = useMutation({
    mutationFn: (slides: Array<{ id: string; order: number }>) => adminService.reorderSlides(slides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slideshow'] });
      showToast('Slides reordered successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to reorder slides', 'error');
    }
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

  const sortedSlides = slides ? [...slides].sort((a, b) => a.order - b.order) : [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Slideshow Management</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Slide
        </button>
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
        variant="danger"
      />

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              required
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.imageUrl && (
              <div className="mt-2 w-32 h-20 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={normalizeImageUrl(formData.imageUrl)}
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


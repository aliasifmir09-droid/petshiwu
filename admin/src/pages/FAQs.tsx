import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { Plus, Edit, Trash2, Search, Eye, EyeOff, HelpCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import Dropdown from '@/components/Dropdown';
import { FAQ, FAQFormData } from '@/types/faq';

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

const FAQs = () => {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isPublishedFilter, setIsPublishedFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    faqId?: string;
    faqQuestion?: string;
  }>({ isOpen: false });

  // Fetch FAQs
  const { data: faqsData, isLoading } = useQuery({
    queryKey: ['faqs', 'admin', page, searchQuery, categoryFilter, isPublishedFilter],
    queryFn: () => adminService.getFAQs({
      page,
      limit: 20,
      search: searchQuery || undefined,
      category: categoryFilter || undefined,
      isPublished: isPublishedFilter ? isPublishedFilter === 'true' : undefined
    }),
    retry: false
  });


  // Create FAQ mutation
  const createMutation = useMutation({
    mutationFn: (data: FAQFormData) => adminService.createFAQ(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] });
      setShowModal(false);
      setEditingFAQ(null);
      showToast('FAQ created successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Failed to create FAQ', 'error');
    }
  });

  // Update FAQ mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FAQFormData }) =>
      adminService.updateFAQ(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] });
      setShowModal(false);
      setEditingFAQ(null);
      showToast('FAQ updated successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Failed to update FAQ', 'error');
    }
  });

  // Delete FAQ mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteFAQ(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] });
      setDeleteConfirm({ isOpen: false });
      showToast('FAQ deleted successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Failed to delete FAQ', 'error');
    }
  });

  const handleCreate = () => {
    setEditingFAQ(null);
    setShowModal(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setShowModal(true);
  };

  const handleDelete = (faq: FAQ) => {
    setDeleteConfirm({
      isOpen: true,
      faqId: faq._id,
      faqQuestion: faq.question,
    });
  };

  const handleSubmit = (data: FAQFormData) => {
    if (editingFAQ) {
      updateMutation.mutate({ id: editingFAQ._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const FAQ_CATEGORIES = [
    'Shipping',
    'Returns',
    'Products',
    'Orders',
    'Account',
    'Payment',
    'General',
    'Autoship',
    'Gift Cards',
    'Pet Care'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">FAQs</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> New FAQ
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search FAQs..."
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
              { value: '', label: 'All Categories' },
              ...FAQ_CATEGORIES.map((cat) => ({
                value: cat,
                label: cat
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

      {/* FAQs List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading FAQs...</p>
        </div>
      ) : !faqsData?.data || faqsData.data.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <HelpCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-lg font-medium text-gray-600">No FAQs found</p>
          <p className="text-sm text-gray-500 mt-2">
            {searchQuery || categoryFilter
              ? 'Try adjusting your filters'
              : 'Create your first FAQ to get started'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {faqsData.data.map((faq: FAQ, index: number) => (
                    <tr key={getUniqueKey(faq._id, index, 'faq')} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{faq.question}</div>
                        <div className="text-xs text-gray-500 mt-1">{truncateText(faq.answer, 80)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{faq.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{faq.order}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {faq.isPublished ? (
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
                        <span className="text-sm text-gray-600">{faq.views || 0}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600 flex items-center gap-1">
                            <ThumbsUp size={14} />
                            {faq.helpfulCount || 0}
                          </span>
                          <span className="text-red-600 flex items-center gap-1">
                            <ThumbsDown size={14} />
                            {faq.notHelpfulCount || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(faq)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                            title="Edit FAQ"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(faq)}
                            className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                            title="Delete FAQ"
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
          {faqsData.pagination && faqsData.pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {faqsData.pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(faqsData.pagination.pages, p + 1))}
                disabled={page === faqsData.pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* FAQ Form Modal */}
      {showModal && (
        <FAQFormModal
          faq={editingFAQ}
          onClose={() => {
            setShowModal(false);
            setEditingFAQ(null);
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
          if (deleteConfirm.faqId) {
            deleteMutation.mutate(deleteConfirm.faqId);
          }
        }}
        title="Delete FAQ"
        message={
          <>
            Are you sure you want to delete this FAQ?
            <br />
            <strong>{deleteConfirm.faqQuestion}</strong>
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

// FAQ Form Modal Component
interface FAQFormModalProps {
  faq: FAQ | null;
  onClose: () => void;
  onSubmit: (data: FAQFormData) => void;
  isLoading: boolean;
}

const FAQFormModal = ({ faq, onClose, onSubmit, isLoading }: FAQFormModalProps) => {
  const [formData, setFormData] = useState<FAQFormData>({
    question: faq?.question || '',
    answer: faq?.answer || '',
    category: faq?.category || 'General',
    petType: faq?.petType || 'all',
    order: faq?.order || 0,
    isPublished: faq?.isPublished || false,
    tags: faq?.tags?.join(', ') || ''
  });

  const FAQ_CATEGORIES = [
    'Shipping',
    'Returns',
    'Products',
    'Orders',
    'Account',
    'Payment',
    'General',
    'Autoship',
    'Gift Cards',
    'Pet Care'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert tags string to array for API submission
    const tagsArray = formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    onSubmit({
      ...formData,
      tags: tagsArray.join(', ') // Pass as comma-separated string for form data
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {faq ? 'Edit FAQ' : 'Create New FAQ'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Question *</label>
            <input
              type="text"
              required
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the question"
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Answer *</label>
            <textarea
              required
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={8}
              placeholder="Enter the answer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {FAQ_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pet Type</label>
              <select
                value={formData.petType}
                onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Pets</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="fish">Fish</option>
                <option value="small-pet">Small Pet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="shipping, delivery, orders"
            />
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
              {isLoading ? 'Saving...' : faq ? 'Update FAQ' : 'Create FAQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FAQs;


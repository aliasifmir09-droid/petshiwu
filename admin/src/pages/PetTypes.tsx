import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, ArrowUp, ArrowDown } from 'lucide-react';
import { adminService } from '@/services/adminService';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

// Helper function to safely convert any ID to a unique string key
// This ensures React keys are always strings, never objects
const getUniqueKey = (id: any, index: number, prefix: string = 'item'): string => {
  // Always include index to guarantee uniqueness even if IDs are duplicated
  const indexSuffix = `-idx${index}`;
  
  if (id === null || id === undefined) {
    return `${prefix}${indexSuffix}`;
  }
  
  // Handle string IDs - most common case
  if (typeof id === 'string') {
    return `${id}${indexSuffix}`;
  }
  
  // Handle number IDs
  if (typeof id === 'number') {
    return `${id}${indexSuffix}`;
  }
  
  // Handle boolean IDs (unlikely but safe)
  if (typeof id === 'boolean') {
    return `${id}${indexSuffix}`;
  }
  
  // Handle object IDs (Mongoose ObjectId, etc.)
  if (typeof id === 'object') {
    // Try toString() method first (Mongoose ObjectId has this)
    if (id && typeof id.toString === 'function') {
      try {
        const str = id.toString();
        // Check if toString() actually returned a useful string
        if (str && typeof str === 'string' && str !== '[object Object]' && str.length > 0) {
          return `${str}${indexSuffix}`;
        }
      } catch (e) {
        // toString() failed, try other methods
      }
    }
    
    // Try valueOf() method
    if (id && typeof id.valueOf === 'function') {
      try {
        const val = id.valueOf();
        // If valueOf returns something different, recurse
        if (val !== id && val !== null && val !== undefined) {
          return getUniqueKey(val, index, prefix);
        }
      } catch (e) {
        // valueOf() failed, try other methods
      }
    }
    
    // Try accessing _id property if it exists (nested object)
    if (id._id) {
      return getUniqueKey(id._id, index, prefix);
    }
    
    // Last resort: use index only (safest fallback)
    // Don't try JSON.stringify as it might fail or create very long keys
  }
  
  // Final fallback: use index only (guaranteed to be unique)
  return `${prefix}${indexSuffix}`;
};

interface PetType {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const PetTypes = () => {
  const { toast, showToast, hideToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingPetType, setEditingPetType] = useState<PetType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '🐾',
    description: '',
    isActive: true
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    petTypeId?: string;
    petTypeName?: string;
  }>({ isOpen: false });

  // Fetch pet types
  // CRITICAL: Set staleTime to 0 and refetchOnMount to ensure immediate updates after mutations
  const { data: petTypesResponse, isLoading } = useQuery({
    queryKey: ['admin-pet-types'],
    queryFn: adminService.getAllPetTypesAdmin,
    refetchOnMount: true, // Always refetch when component mounts
    staleTime: 0, // Always consider data stale - refetch immediately when invalidated
    gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes for garbage collection
  });

  // Sort pet types by order, then by name as fallback
  // PERFORMANCE FIX: Ensure proper sorting with null/undefined handling
  const petTypes: PetType[] = useMemo(() => {
    const types = petTypesResponse?.data || [];
    return [...types].sort((a, b) => {
      // First sort by order (handle null/undefined by treating as 0)
      const orderA = a.order !== null && a.order !== undefined ? a.order : 0;
      const orderB = b.order !== null && b.order !== undefined ? b.order : 0;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // If order is the same, sort by name
      return a.name.localeCompare(b.name);
    });
  }, [petTypesResponse?.data]);

  // Auto-refresh hook - automatically refreshes queries after mutations
  // This ensures the page shows updated data immediately after create/update/delete
  // Note: 'pet-types' is the frontend query key, so reordering will update the frontend nav
  const { onMutationSuccess, onMutationError } = useAutoRefresh(
    ['admin-pet-types', 'pet-types'], // Query keys to refresh (includes frontend cache)
    { showToast } // Pass toast function for automatic success/error messages
  );

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPetType(null);
    setFormData({
      name: '',
      icon: '🐾',
      description: '',
      isActive: true
    });
  };

  // Create pet type mutation - automatically refreshes the page
  const createMutation = useMutation({
    mutationFn: adminService.createPetType,
    onSuccess: onMutationSuccess('Pet type created successfully!', handleCloseModal),
    onError: onMutationError()
  });

  // Update pet type mutation - automatically refreshes the page
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updatePetType(id, data),
    onSuccess: onMutationSuccess('Pet type updated successfully!', handleCloseModal),
    onError: onMutationError()
  });

  // Delete pet type mutation - automatically refreshes the page
  const deleteMutation = useMutation({
    mutationFn: adminService.deletePetType,
    onSuccess: onMutationSuccess('Pet type deleted successfully!', () => {
      setDeleteConfirm({ isOpen: false });
    }),
    onError: onMutationError()
  });

  // Reorder pet types mutation
  const reorderMutation = useMutation({
    mutationFn: adminService.reorderPetTypes,
    onSuccess: onMutationSuccess('Pet types reordered successfully!'),
    onError: onMutationError()
  });

  // Handle reorder (move up or down by 1 position)
  // Each click moves the pet-type 1 position in the specified direction
  const handleReorder = (petTypeId: string, direction: 'up' | 'down') => {
    const currentIndex = petTypes.findIndex(pt => pt._id === petTypeId);
    if (currentIndex === -1) {
      console.warn(`Pet type ${petTypeId} not found in list`);
      return;
    }

    // Calculate new index (move by 1 position)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Validate bounds
    if (newIndex < 0 || newIndex >= petTypes.length) {
      console.warn(`Cannot move ${direction}: already at ${direction === 'up' ? 'top' : 'bottom'}`);
      return;
    }

    // Create new array with swapped positions
    // This swaps the current item with the adjacent item (1 position up or down)
    const newOrder = [...petTypes];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

    // Extract IDs in new order (this represents the new order after swapping)
    const petTypeIds = newOrder.map(pt => pt._id);
    
    // Call reorder mutation - backend will assign sequential order values (0, 1, 2, 3...)
    reorderMutation.mutate(petTypeIds);
  };

  const handleOpenModal = (petType?: PetType) => {
    if (petType) {
      setEditingPetType(petType);
      setFormData({
        name: petType.name,
        icon: petType.icon,
        description: petType.description || '',
        isActive: petType.isActive
      });
    } else {
      setEditingPetType(null);
      setFormData({
        name: '',
        icon: '🐾',
        description: '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPetType) {
      updateMutation.mutate({ id: editingPetType._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (petType: PetType) => {
    setDeleteConfirm({
      isOpen: true,
      petTypeId: petType._id,
      petTypeName: petType.name
    });
  };

  const confirmDelete = () => {
    if (deleteConfirm.petTypeId) {
      deleteMutation.mutate(deleteConfirm.petTypeId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading pet types...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toast toast={toast} onClose={hideToast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Navigation Menu - Pet Types</h1>
          <p className="text-gray-600 mt-1">
            Manage pet types for the navigation menu (Dog, Cat, Other Animals, etc.)
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
        >
          <Plus size={20} />
          Add Pet Type
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="text-blue-600 text-sm font-medium">Total Pet Types</div>
          <div className="text-3xl font-bold text-blue-900 mt-1">{petTypes.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="text-green-600 text-sm font-medium">Active</div>
          <div className="text-3xl font-bold text-green-900 mt-1">
            {petTypes.filter(pt => pt.isActive).length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
          <div className="text-gray-600 text-sm font-medium">Inactive</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">
            {petTypes.filter(pt => !pt.isActive).length}
          </div>
        </div>
      </div>

      {/* Pet Types List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {petTypes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">No pet types yet</p>
            <p className="text-sm mt-2">Create your first pet type to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Icon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {petTypes.map((petType, index) => (
                  <tr key={getUniqueKey(petType?._id, index, 'pettype')} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleReorder(petType._id, 'up')}
                          disabled={index === 0 || reorderMutation.isPending}
                          className="text-gray-400 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          onClick={() => handleReorder(petType._id, 'down')}
                          disabled={index === petTypes.length - 1 || reorderMutation.isPending}
                          className="text-gray-400 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-3xl">
                      {petType.icon}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{petType.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{petType.slug}</code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {petType.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        petType.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {petType.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(petType)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(petType)}
                          className="text-red-600 hover:text-red-900"
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
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPetType ? 'Edit Pet Type' : 'Add New Pet Type'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pet Type Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Dog, Cat, Bird"
                />
              </div>

              {/* Icon */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Emoji) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-3xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="🐾"
                  maxLength={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use an emoji to represent this pet type
                </p>
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
                  placeholder="Brief description of this pet type"
                />
              </div>

              {/* Active Status */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {editingPetType ? 'Update Pet Type' : 'Create Pet Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete pet type <strong>{deleteConfirm.petTypeName}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false })}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetTypes;


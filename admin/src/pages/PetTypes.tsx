import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, GripVertical, X } from 'lucide-react';
import { adminService } from '@/services/adminService';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

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
  const queryClient = useQueryClient();
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
  const { data: petTypesResponse, isLoading } = useQuery({
    queryKey: ['admin-pet-types'],
    queryFn: adminService.getAllPetTypesAdmin
  });

  const petTypes: PetType[] = petTypesResponse?.data || [];

  // Create pet type mutation
  const createMutation = useMutation({
    mutationFn: adminService.createPetType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pet-types'] });
      showToast('Pet type created successfully!', 'success');
      handleCloseModal();
    },
    onError: (error: any) => {
      showToast(error?.message || error?.response?.data?.message || 'Failed to create pet type', 'error');
    }
  });

  // Update pet type mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updatePetType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pet-types'] });
      showToast('Pet type updated successfully!', 'success');
      handleCloseModal();
    },
    onError: (error: any) => {
      showToast(error?.message || error?.response?.data?.message || 'Failed to update pet type', 'error');
    }
  });

  // Delete pet type mutation
  const deleteMutation = useMutation({
    mutationFn: adminService.deletePetType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pet-types'] });
      showToast('Pet type deleted successfully!', 'success');
      setDeleteConfirm({ isOpen: false });
    },
    onError: (error: any) => {
      showToast(error?.message || error?.response?.data?.message || 'Failed to delete pet type', 'error');
    }
  });

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
                {petTypes.map((petType) => (
                  <tr key={petType._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-gray-400 hover:text-gray-600 cursor-move">
                        <GripVertical size={20} />
                      </button>
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


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, Address } from '@/services/users';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyState from '@/components/EmptyState';
import { MapPin, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import ConfirmationModal from '@/components/ConfirmationModal';

const AddressManagement = () => {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const { data: addresses, isLoading, error } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userService.getAddresses()
  });

  const [formData, setFormData] = useState<Omit<Address, '_id'>>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    phone: '',
    isDefault: false
  });

  const addAddressMutation = useMutation({
    mutationFn: (data: Omit<Address, '_id'>) => userService.addAddress(data),
    onSuccess: () => {
      showToast('Address added successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to add address', 'error');
    }
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Address> }) =>
      userService.updateAddress(id, data),
    onSuccess: () => {
      showToast('Address updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setEditingId(null);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update address', 'error');
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => userService.deleteAddress(id),
    onSuccess: () => {
      showToast('Address deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowDeleteModal(null);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete address', 'error');
    }
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      phone: '',
      isDefault: false
    });
  };

  const startEdit = (address: Address) => {
    setEditingId(address._id || null);
    setFormData({
      firstName: address.firstName,
      lastName: address.lastName,
      address: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone,
      isDefault: address.isDefault || false
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateAddressMutation.mutate({ id: editingId, data: formData });
    } else {
      addAddressMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message="Failed to load addresses"
          retry={() => queryClient.invalidateQueries({ queryKey: ['addresses'] })}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Addresses</h1>
        {!showAddForm && !editingId && (
          <button
            onClick={() => {
              setShowAddForm(true);
              resetForm();
            }}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700"
          >
            <Plus size={20} />
            Add Address
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Edit Address' : 'Add New Address'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Street Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State *</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ZIP Code *</label>
                <input
                  type="text"
                  required
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Country *</label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm">Set as default address</label>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  cancelEdit();
                  setShowAddForm(false);
                }}
                className="flex-1 border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addAddressMutation.isPending || updateAddressMutation.isPending}
                className="flex-1 bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
              >
                {editingId ? 'Update Address' : 'Add Address'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses List */}
      {!addresses || addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-16 h-16" />}
          title="No Addresses Saved"
          description="Add your first address to get started"
        />
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`bg-white rounded-lg shadow p-6 ${
                address.isDefault ? 'border-2 border-primary-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {address.isDefault && (
                    <span className="inline-block bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-1 rounded mb-2">
                      Default
                    </span>
                  )}
                  <h3 className="font-semibold text-lg mb-2">
                    {address.firstName} {address.lastName}
                  </h3>
                  <p className="text-gray-600">{address.address}</p>
                  <p className="text-gray-600">
                    {address.city}, {address.state} {address.zipCode}
                  </p>
                  <p className="text-gray-600">{address.country}</p>
                  <p className="text-gray-600 mt-2">Phone: {address.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(address)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                    aria-label="Edit address"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(address._id || null)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    aria-label="Delete address"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmationModal
          isOpen={!!showDeleteModal}
          onClose={() => setShowDeleteModal(null)}
          onConfirm={() => {
            if (showDeleteModal) {
              deleteAddressMutation.mutate(showDeleteModal);
            }
          }}
          title="Delete Address"
          message="Are you sure you want to delete this address? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={deleteAddressMutation.isPending}
        />
      )}

      {/* Toast */}
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};

export default AddressManagement;


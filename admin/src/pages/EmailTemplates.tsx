import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { Plus, Edit, Trash2, Mail, X, Save } from 'lucide-react';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import ConfirmationModal from '@/components/ConfirmationModal';

const EmailTemplates = () => {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; templateId?: string; templateName?: string }>({ isOpen: false });
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    variables: [] as string[],
    isActive: true
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: adminService.getEmailTemplates
  });

  const createMutation = useMutation({
    mutationFn: adminService.createEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      setShowModal(false);
      setFormData({ name: '', subject: '', body: '', variables: [], isActive: true });
      showToast('Email template created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create template', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateEmailTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      setShowModal(false);
      setEditingTemplate(null);
      setFormData({ name: '', subject: '', body: '', variables: [], isActive: true });
      showToast('Email template updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update template', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      setDeleteConfirm({ isOpen: false });
      showToast('Email template deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete template', 'error');
    }
  });

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({ name: '', subject: '', body: '', variables: [], isActive: true });
    setShowModal(true);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      variables: template.variables || [],
      isActive: template.isActive
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (templateId: string, templateName: string) => {
    setDeleteConfirm({ isOpen: true, templateId, templateName });
  };

  const confirmDelete = () => {
    if (deleteConfirm.templateId) {
      deleteMutation.mutate(deleteConfirm.templateId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 lg:p-8 shadow-xl animate-fade-in-up">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Email Templates</h1>
            <p className="text-blue-100 text-lg">Manage email templates for order confirmations and notifications</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-white text-[#1E3A8A] px-6 py-3 rounded-xl hover:bg-blue-50 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Plus size={20} />
            Create Template
          </button>
        </div>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-600">Loading templates...</p>
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template: any) => (
            <div key={template._id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{template.name}</h3>
                    <p className={`text-sm ${template.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Subject:</p>
                <p className="text-sm text-gray-600">{template.subject}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Body Preview:</p>
                <p className="text-sm text-gray-600 line-clamp-3">{template.body.substring(0, 100)}...</p>
              </div>

              {template.variables && template.variables.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable: string, idx: number) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template._id, template.name)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <Mail className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Email Templates</h3>
          <p className="text-gray-600 mb-4">Create your first email template to get started.</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Create Template
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTemplate(null);
                  setFormData({ name: '', subject: '', body: '', variables: [], isActive: true });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Order Confirmation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Order #{{orderNumber}} Confirmed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body *</label>
                <textarea
                  required
                  rows={10}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email body content. Use {{variableName}} for dynamic content."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {'{{customerName}}'}, {'{{orderNumber}}'}, {'{{orderTotal}}'}, etc.
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTemplate(null);
                    setFormData({ name: '', subject: '', body: '', variables: [], isActive: true });
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Email Template"
        message={`Are you sure you want to delete "${deleteConfirm.templateName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isLoading={deleteMutation.isPending}
      />

      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
};

export default EmailTemplates;


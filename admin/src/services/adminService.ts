import api from './api';

export const adminService = {
  // Auth
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data?.success && response.data?.token) {
      localStorage.setItem('adminToken', response.data.token);
    } else if (response.data?.success && response.data?.data?.token) {
      localStorage.setItem('adminToken', response.data.data.token);
    }
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('adminToken');
  },

  // Products
  getProducts: async (params?: any) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProduct: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },

  createProduct: async (data: any) => {
    const response = await api.post('/products', data);
    return response.data.data;
  },

  updateProduct: async (id: string, data: any) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data.data;
  },

  deleteProduct: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  getProductStats: async () => {
    const response = await api.get('/products/stats');
    return response.data.data;
  },

  // Orders
  getAllOrders: async (params?: any) => {
    const response = await api.get('/orders/all', { params });
    return response.data;
  },

  getOrder: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },

  updateOrderStatus: async (id: string, data: any) => {
    const response = await api.put(`/orders/${id}/status`, data);
    return response.data.data;
  },

  updatePaymentStatus: async (id: string, data: any) => {
    const response = await api.put(`/orders/${id}/payment`, data);
    return response.data.data;
  },

  getOrderStats: async () => {
    const response = await api.get('/orders/stats');
    return response.data.data;
  },

  // Categories
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data.data;
  },

  getAllCategoriesAdmin: async () => {
    const response = await api.get('/categories/admin/all');
    return response.data;
  },

  createCategory: async (data: any) => {
    const response = await api.post('/categories', data);
    return response.data.data;
  },

  updateCategory: async (id: string, data: any) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.data;
  },

  deleteCategory: async (id: string) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  // Upload
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  },

  // User Management (Admin Only)
  getStaffUsers: async () => {
    const response = await api.get('/users/staff');
    return response.data;
  },

  createStaffUser: async (data: any) => {
    const response = await api.post('/users/staff', data);
    return response.data.data;
  },

  updateStaffUser: async (id: string, data: any) => {
    const response = await api.put(`/users/staff/${id}`, data);
    return response.data.data;
  },

  deleteStaffUser: async (id: string) => {
    const response = await api.delete(`/users/staff/${id}`);
    return response.data;
  },

  getMyPermissions: async () => {
    const response = await api.get('/users/me/permissions');
    return response.data.data;
  },

  // Change password (available for all authenticated users)
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.put('/auth/updatepassword', data);
    return response.data;
  },

  // Customers
  getCustomers: async () => {
    const response = await api.get('/users/customers');
    return response.data;
  },

  getCustomerOrders: async (customerId: string) => {
    const response = await api.get(`/users/customers/${customerId}/orders`);
    return response.data;
  },

  // Pet Types
  getPetTypes: async () => {
    const response = await api.get('/pet-types');
    return response.data;
  },

  getAllPetTypesAdmin: async () => {
    const response = await api.get('/pet-types/admin/all');
    return response.data;
  },

  getPetType: async (slug: string) => {
    const response = await api.get(`/pet-types/${slug}`);
    return response.data.data;
  },

  createPetType: async (data: any) => {
    const response = await api.post('/pet-types', data);
    return response.data.data;
  },

  updatePetType: async (id: string, data: any) => {
    const response = await api.put(`/pet-types/${id}`, data);
    return response.data.data;
  },

  deletePetType: async (id: string) => {
    const response = await api.delete(`/pet-types/${id}`);
    return response.data;
  },

  reorderPetTypes: async (petTypeIds: string[]) => {
    const response = await api.post('/pet-types/reorder', { petTypeIds });
    return response.data;
  }
};




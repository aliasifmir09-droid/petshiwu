import api from './api';

export const adminService = {
  // Auth
  login: async (email: string, password: string) => {
    try {
      // Clear any existing token first
      localStorage.removeItem('adminToken');
      
      const response = await api.post('/auth/login', { email, password });
      
      // Extract token from response
      let token = null;
      if (response.data?.success && response.data?.token) {
        token = response.data.token;
      } else if (response.data?.success && response.data?.data?.token) {
        token = response.data.data.token;
      }
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      // Save token to localStorage
      localStorage.setItem('adminToken', token);
      
      // Verify token was saved
      const savedToken = localStorage.getItem('adminToken');
      if (savedToken !== token) {
        throw new Error('Failed to save token');
      }
      
      return response.data;
    } catch (error: any) {
      // Ensure token is cleared on error
      localStorage.removeItem('adminToken');
      throw error;
    }
  },

  getMe: async () => {
    // Verify token exists before making request
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (error: any) {
      // If 401, clear token and rethrow
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
      }
      throw error;
    }
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

  // Upload image to Cloudinary (or local storage fallback)
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Log response for debugging
      console.log('Upload response:', response.data);
      
      // Handle different response structures
      const data = response.data?.data || response.data;
      
      if (!data) {
        throw new Error('Invalid response structure from server');
      }
      
      // Response includes: { url, path, filename, mimetype, size, ... }
      // url is Cloudinary URL, path is fallback for local storage
      return data;
    } catch (error: any) {
      console.error('Upload API error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
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




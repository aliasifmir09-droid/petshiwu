import api from './api';
import type { FAQ, FAQFormData, FAQCategory, FAQQueryParams } from '@/types/faq';

export const adminService = {
  // CSV Import
  importProductsFromCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('csv', file);
    
    const response = await api.post('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },

  // JSON Import
  importProductsFromJSON: async (file: File) => {
    const formData = new FormData();
    formData.append('json', file);
    
    const response = await api.post('/products/import/json', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },

  downloadJSONTemplate: async () => {
    try {
      const response = await api.get('/products/import/json/template', {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'product-import-template.json');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      // Fallback: create template client-side if endpoint fails
      console.warn('Failed to download template from server, using fallback:', error);
      const template = [
        {
          "name": "Example Product",
          "description": "Product description here. This is a detailed description of the product.",
          "shortDescription": "Short description",
          "brand": "Brand Name",
          "category": "Dog > Food > Dry Food",
          "basePrice": 29.99,
          "compareAtPrice": 39.99,
          "petType": "dog",
          "images": ["https://example.com/image.jpg"],
          "tags": ["tag1", "tag2"],
          "features": ["feature1", "feature2"],
          "ingredients": "Ingredients list",
          "isActive": true,
          "isFeatured": false,
          "inStock": true,
          "stock": 100,
          "lowStockThreshold": 10,
          "variants": [
            {
              "attributes": {
                "size": "5 lb",
                "flavor": "Chicken"
              },
              "price": 29.99,
              "compareAtPrice": 39.99,
              "stock": 50,
              "sku": "PRODUCT-SKU-001"
            }
          ]
        }
      ];
      
      const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'product-import-template.json');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  },

  downloadCSVTemplate: async () => {
    // Create comprehensive CSV template with detailed examples and instructions
    const csvContent = `# PRODUCT IMPORT TEMPLATE
# Instructions:
# 1. Required fields: name, description, brand, category, basePrice, petType, images
# 2. Optional fields: shortDescription, compareAtPrice, tags, features, ingredients, isActive, isFeatured, inStock, stock
# 3. Images: Separate multiple URLs with commas or pipe (|) characters
# 4. Tags & Features: Separate multiple values with commas
# 5. Pet Types: Use lowercase (dog, cat, bird, fish, small-pet, reptile)
# 6. Category: Use exact category name OR hierarchical path like "Dog > Food > Dry Food"
#    - Simple: "Dog Food" (finds existing category)
#    - Hierarchical: "Dog > Food > Dry Food" (creates hierarchy if needed)
#    - The system will automatically create missing parent categories
# 7. Boolean fields: Use "true" or "false" (case-insensitive)
# 8. Variants: For simple products, leave variants empty. For products with sizes/variants, use variantSize, variantPrice, variantStock, variantSku columns
#
# Remove this comment section (lines starting with #) before importing

name,description,shortDescription,brand,category,basePrice,compareAtPrice,petType,images,tags,features,ingredients,isActive,isFeatured,inStock,stock,variantSize,variantPrice,variantStock,variantSku
Premium Dog Food,High-quality premium dog food with natural ingredients for all dog breeds. Rich in protein and essential nutrients to keep your dog healthy and active.,Premium nutrition for your furry friend,PetBrand,Dog > Food > Dry Food,49.99,59.99,dog,https://example.com/dog-food-1.jpg,https://example.com/dog-food-2.jpg,premium,healthy,nutrition,Natural chicken, brown rice, vegetables,true,true,true,100,5kg,49.99,50,DOG-FOOD-5KG-001
Organic Cat Litter,100% natural and biodegradable cat litter. Odor-free and clumping formula for easy cleanup.,Eco-friendly cat litter,OrganicPet,Cat Litter,24.99,,cat,https://example.com/cat-litter-1.jpg,organic,eco-friendly,biodegradable,Natural clay,true,false,true,75,10lb,24.99,75,CAT-LITTER-10LB-001
Bird Seed Mix,Delicious seed mix for all types of birds. Contains sunflower seeds, millet, and other nutritious grains.,Nutritious seed blend for birds,BirdCare,Bird Food,12.99,15.99,bird,https://example.com/bird-seed-1.jpg,bird-food,seeds,nutrition,Sunflower seeds, millet, corn,true,false,true,200,2lb,12.99,200,BIRD-SEED-2LB-001
Fish Tank Filter,High-performance aquarium filter with 3-stage filtration system. Suitable for tanks up to 50 gallons.,Advanced filtration system,AquaTech,Fish Supplies,89.99,109.99,fish,https://example.com/filter-1.jpg,filter,aquarium,equipment,Plastic, carbon filter, true,true,true,30,false,,
Small Pet Bedding,Soft and comfortable bedding for hamsters, rabbits, and guinea pigs. Absorbent and easy to clean.,Comfortable bedding for small pets,SmallPetCo,Small Pet Supplies,8.99,,small-pet,https://example.com/bedding-1.jpg,bedding,comfort,absorbent,Recycled paper,true,false,true,150,false,,
Reptile Heat Lamp,Full-spectrum heat lamp for reptiles. Provides UVB and heat for optimal reptile health.,Essential heating for reptiles,ReptilePro,Reptile Supplies,34.99,44.99,reptile,https://example.com/heat-lamp-1.jpg,heating,uvb,reptile-care,Glass, ceramic,true,true,true,25,false,,
Dog Toy Rope,Interactive rope toy for dogs. Great for tug-of-war and fetch games. Durable and safe for all dog sizes.,Fun interactive toy for dogs,ToyBrand,Dog Toys,14.99,19.99,dog,https://example.com/toy-1.jpg,https://example.com/toy-2.jpg,toy,interactive,durable,Cotton rope,true,false,true,80,true,,
Cat Scratching Post,Tall scratching post with multiple levels. Includes hanging toys and a cozy perch on top.,Multi-level cat activity center,CatFurniture,Cat Furniture,79.99,99.99,cat,https://example.com/scratch-post-1.jpg,https://example.com/scratch-post-2.jpg,furniture,scratching,activity,Sisal rope, carpet,true,true,true,20,false,,`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
  // Auth
  login: async (email: string, password: string) => {
    try {
      // Phase 2: Cookie-Only - Backend sets httpOnly cookie, no token in response
      const response = await api.post('/auth/login', { email, password });
      
      // Check if request was successful
      if (!response || !response.data) {
        throw new Error('No response received from server');
      }
      
      // Check for error response
      if (response.data.success === false) {
        const errorMessage = response.data.message || 'Login failed';
        throw new Error(errorMessage);
      }
      
      // Phase 2: Cookie-Only - No token in response, cookie is set automatically
      // If error is about missing token, that's expected in Phase 2 (cookie-only)
      // The cookie is set automatically by the browser, so we can ignore token extraction errors
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }
      
      return response.data;
    } catch (error: any) {
      // Improve error message
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || 
                           error.response.statusText || 
                           `Server error: ${error.response.status}`;
        throw new Error(errorMessage);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Error in request setup
        throw error;
      }
    }
  },

  getMe: async (skipAuth = false) => {
    // Phase 2: Cookie-Only - No localStorage token check needed
    // Cookie is sent automatically via withCredentials: true
    // skipAuth prevents redirect loops when checking auth status on login page
    try {
      const response = await api.get('/auth/me', { skipAuth } as any);
      return response.data.data;
    } catch (error: any) {
      // If 401, cookie is invalid or expired - backend will handle it
      throw error;
    }
  },

  logout: async () => {
    // Phase 2: Cookie-Only - Call logout endpoint to clear httpOnly cookie
    // Backend handles cookie clearing, no localStorage to manage
    // Use skipAuth to prevent 401 redirect during logout
    await api.post('/auth/logout', {}, { skipAuth: true } as any);
  },

  // Products
  getProducts: async (params?: any) => {
    // Convert boolean inStock to string for backend compatibility
    const processedParams = params ? { ...params } : {};
    if (processedParams.inStock !== undefined && typeof processedParams.inStock === 'boolean') {
      processedParams.inStock = String(processedParams.inStock);
    }
    const response = await api.get('/products', { params: processedParams });
    return response.data;
  },

  getProduct: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },

  createProduct: async (data: any) => {
    try {
      const response = await api.post('/products', data);
      return response.data.data;
    } catch (error: any) {
      // Log error without sensitive data
      // Use safe error logging
      const { safeError } = await import('../utils/safeLogger');
      safeError('Create product API error', error);
      // Don't log full error response - may contain sensitive data
      throw error;
    }
  },

  updateProduct: async (id: string, data: any) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data.data;
  },

  deleteProduct: async (id: string) => {
    // Ensure ID is a string and valid MongoDB ObjectId format
    const productId = String(id).trim();
    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
      throw new Error('Invalid product ID format');
    }
    try {
      const response = await api.delete(`/products/${encodeURIComponent(productId)}`);
      return response.data;
    } catch (error: any) {
      // If 404, the product might already be deleted - still throw to let UI handle it
      if (error.response?.status === 404) {
        throw error;
      }
      throw error;
    }
  },

  restoreProduct: async (id: string) => {
    // Ensure ID is a string and valid MongoDB ObjectId format
    const productId = String(id);
    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
      throw new Error('Invalid product ID format');
    }
    const response = await api.post(`/products/${productId}/restore`);
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
    // Ensure ID is a string and valid
    const orderId = String(id).trim();
    if (!orderId || orderId === 'undefined' || orderId === 'null') {
      throw new Error('Invalid order ID');
    }
    
    // Ensure orderStatus is valid if provided
    if (data.orderStatus) {
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(data.orderStatus)) {
        throw new Error(`Invalid order status: ${data.orderStatus}`);
      }
    }
    
    const response = await api.put(`/orders/${encodeURIComponent(orderId)}/status`, data);
    return response.data.data;
  },

  processRefund: async (id: string, data: { amount: number; reason?: string }) => {
    const orderId = String(id).trim();
    if (!orderId || orderId === 'undefined' || orderId === 'null') {
      throw new Error('Invalid order ID');
    }
    const response = await api.post(`/orders/${encodeURIComponent(orderId)}/refund`, data);
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

  updateCategoryPosition: async (id: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const response = await api.put(`/categories/${id}/position`, { direction });
    return response.data;
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
      
      // Handle different response structures
      const data = response.data?.data || response.data;
      
      if (!data) {
        throw new Error('Invalid response structure from server');
      }
      
      // Response includes: { url, path, filename, mimetype, size, ... }
      // url is Cloudinary URL, path is fallback for local storage
      return data;
    } catch (error: any) {
      // Use safe error logging
      const { safeError } = await import('../utils/safeLogger');
      safeError('Upload API error', error);
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
  // Blog Management
  getBlogs: async (params?: { petType?: string; category?: string; page?: number; limit?: number; search?: string; isPublished?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.petType) queryParams.append('petType', params.petType);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());
    
    const response = await api.get(`/blogs/admin/all?${queryParams.toString()}`);
    return response.data;
  },

  getBlogById: async (id: string) => {
    const response = await api.get(`/blogs/admin/${id}`);
    return response.data;
  },

  createBlog: async (blogData: { title: string; content: string; category: string; [key: string]: unknown }) => {
    const response = await api.post('/blogs/admin', blogData);
    return response.data;
  },

  updateBlog: async (id: string, blogData: { title?: string; content?: string; category?: string; [key: string]: unknown }) => {
    const response = await api.put(`/blogs/admin/${id}`, blogData);
    return response.data;
  },

  deleteBlog: async (id: string) => {
    const response = await api.delete(`/blogs/admin/${id}`);
    return response.data;
  },

  getBlogCategories: async (petType?: string) => {
    const queryParams = petType ? `?petType=${petType}` : '';
    const response = await api.get(`/blogs/categories${queryParams}`);
    return response.data;
  },

  // Care Guide Management
  getCareGuides: async (params?: { petType?: string; category?: string; page?: number; limit?: number; search?: string; difficulty?: string; isPublished?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.petType) queryParams.append('petType', params.petType);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());
    
    const response = await api.get(`/care-guides/admin/all?${queryParams.toString()}`);
    return response.data;
  },

  getCareGuideById: async (id: string) => {
    const response = await api.get(`/care-guides/admin/${id}`);
    return response.data;
  },

  createCareGuide: async (careGuideData: { title: string; content: string; category: string; [key: string]: unknown }) => {
    const response = await api.post('/care-guides/admin', careGuideData);
    return response.data;
  },

  updateCareGuide: async (id: string, careGuideData: { title?: string; content?: string; category?: string; [key: string]: unknown }) => {
    const response = await api.put(`/care-guides/admin/${id}`, careGuideData);
    return response.data;
  },

  deleteCareGuide: async (id: string) => {
    const response = await api.delete(`/care-guides/admin/${id}`);
    return response.data;
  },

  getCareGuideCategories: async (petType?: string) => {
    const queryParams = petType ? `?petType=${petType}` : '';
    const response = await api.get(`/care-guides/categories${queryParams}`);
    return response.data;
  },

  // FAQ Management
  getFAQs: async (params?: FAQQueryParams) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.petType) queryParams.append('petType', params.petType);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());
    
    const response = await api.get(`/faqs/admin/all?${queryParams.toString()}`);
    return response.data;
  },
  getFAQById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: FAQ }>(`/faqs/admin/${id}`);
    return response.data;
  },
  createFAQ: async (faqData: FAQFormData) => {
    const response = await api.post<{ success: boolean; data: FAQ }>('/faqs/admin', faqData);
    return response.data;
  },
  updateFAQ: async (id: string, faqData: FAQFormData) => {
    const response = await api.put<{ success: boolean; data: FAQ }>(`/faqs/admin/${id}`, faqData);
    return response.data;
  },
  deleteFAQ: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/faqs/admin/${id}`);
    return response.data;
  },
  getFAQCategories: async () => {
    const response = await api.get<{ success: boolean; data: FAQCategory[] }>('/faqs/categories');
    return response.data.data;
  },

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
  },

  // Database Statistics
  getDatabaseStats: async () => {
    const response = await api.get('/users/database/stats');
    return response.data.data;
  },

  // Advanced Analytics
  getAdvancedAnalytics: async (period: string = '30d') => {
    const response = await api.get('/analytics/advanced', { params: { period } });
    return response.data.data;
  },

  // Bulk Operations
  bulkUpdateProducts: async (productIds: string[], updates: any) => {
    const response = await api.post('/bulk/products/update', { productIds, updates });
    return response.data.data;
  },

  bulkAssignCategory: async (productIds: string[], categoryId: string) => {
    const response = await api.post('/bulk/products/assign-category', { productIds, categoryId });
    return response.data.data;
  },

  // Export
  exportOrders: async (params?: { startDate?: string; endDate?: string; status?: string }) => {
    const response = await api.get('/export/orders', { 
      params,
      responseType: 'blob' 
    });
    return response.data;
  },

  exportProducts: async (includeInactive: boolean = false) => {
    const response = await api.get('/export/products', { 
      params: { includeInactive },
      responseType: 'blob' 
    });
    return response.data;
  },

  exportCustomers: async (role: string = 'customer') => {
    const response = await api.get('/export/customers', { 
      params: { role },
      responseType: 'blob' 
    });
    return response.data;
  },

  // Email Templates
  getEmailTemplates: async () => {
    const response = await api.get('/email-templates');
    return response.data.data;
  },

  getEmailTemplate: async (id: string) => {
    const response = await api.get(`/email-templates/${id}`);
    return response.data.data;
  },

  createEmailTemplate: async (data: any) => {
    const response = await api.post('/email-templates', data);
    return response.data.data;
  },

  updateEmailTemplate: async (id: string, data: any) => {
    const response = await api.put(`/email-templates/${id}`, data);
    return response.data.data;
  },

  deleteEmailTemplate: async (id: string) => {
    const response = await api.delete(`/email-templates/${id}`);
    return response.data;
  },
  seedEmailTemplates: async () => {
    const response = await api.post('/email-templates/seed');
    return response.data;
  },

  // Slideshow Management
  getSlides: async () => {
    const response = await api.get('/slideshow');
    return response.data.data;
  },

  getSlide: async (id: string) => {
    const response = await api.get(`/slideshow/${id}`);
    return response.data.data;
  },

  createSlide: async (slideData: any) => {
    const response = await api.post('/slideshow', slideData);
    return response.data.data;
  },

  updateSlide: async (id: string, slideData: any) => {
    const response = await api.put(`/slideshow/${id}`, slideData);
    return response.data.data;
  },

  deleteSlide: async (id: string) => {
    const response = await api.delete(`/slideshow/${id}`);
    return response.data;
  },

  reorderSlides: async (slides: Array<{ id: string; order: number }>) => {
    const response = await api.post('/slideshow/reorder', { slides });
    return response.data;
  },

  seedSlideshow: async () => {
    const response = await api.post('/slideshow/seed');
    return response.data;
  }
};




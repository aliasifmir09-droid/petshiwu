import api from './api';
import { Product, PaginatedResponse, ApiResponse } from '@/types';

interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  petType?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'price-asc' | 'price-desc' | 'rating' | 'newest';
  featured?: boolean;
  minRating?: number;
  inStock?: boolean;
}

export const productService = {
  getProducts: async (filters?: ProductFilters) => {
    const response = await api.get<PaginatedResponse<Product>>('/products', {
      params: filters
    });
    return response.data;
  },

  getProduct: async (id: string) => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  getProductById: async (id: string) => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  getRelatedProducts: async (productId: string, limit = 8) => {
    const response = await api.get<PaginatedResponse<Product>>(`/products/${productId}/related`, {
      params: { limit }
    });
    return response.data;
  }
};




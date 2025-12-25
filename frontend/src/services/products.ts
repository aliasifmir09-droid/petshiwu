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
  },

  getUniqueBrands: async (categoryId?: string, petType?: string) => {
    const response = await api.get<ApiResponse<string[]>>('/products/brands', {
      params: {
        ...(categoryId && { category: categoryId }),
        ...(petType && { petType })
      }
    });
    return response.data.data;
  },

  search: async (query: string, filters?: {
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
    category?: string;
    petType?: string;
    brand?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get<PaginatedResponse<Product>>('/products/search', {
      params: {
        q: query,
        ...filters
      }
    });
    return response.data;
  },

  getSearchSuggestions: async (query: string, limit: number = 10) => {
    const response = await api.get<ApiResponse<{ products: Product[]; categories: any[] }>>('/products/search/autocomplete', {
      params: { q: query, limit }
    });
    return response.data;
  }
};




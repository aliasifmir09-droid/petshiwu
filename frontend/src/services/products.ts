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

  getRecommendations: async (productId: string) => {
    const response = await api.get<ApiResponse<any>>(`/products/${productId}/recommendations`);
    return response.data.data;
  },

  getFrequentlyBoughtTogether: async (productId: string) => {
    const response = await api.get<ApiResponse<any>>(`/products/${productId}/frequently-bought-together`);
    return response.data.data;
  },

  compareProducts: async (productIds: string[]) => {
    const response = await api.get<ApiResponse<any>>('/products/compare', {
      params: { productIds: productIds.join(',') }
    });
    return response.data.data;
  },

  getComparisonSuggestions: async (productIds: string[]) => {
    const response = await api.get<ApiResponse<any>>('/products/compare/suggestions', {
      params: { productIds: productIds.join(',') }
    });
    return response.data.data;
  },

  advancedSearch: async (query: string, filters?: {
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
      params: { q: query, ...filters }
    });
    return response.data;
  },

  searchAutocomplete: async (query: string, limit = 10) => {
    const response = await api.get<ApiResponse<any>>('/products/search/autocomplete', {
      params: { q: query, limit }
    });
    return response.data.data;
  },

  getProductShareLinks: async (productId: string) => {
    const response = await api.get<ApiResponse<any>>(`/products/${productId}/share`);
    return response.data.data;
  }
};




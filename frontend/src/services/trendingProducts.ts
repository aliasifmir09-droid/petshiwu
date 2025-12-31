import api from './api';
import { ApiResponse, Product } from '@/types';

interface TrendingProductsResponse {
  data: Product[];
  meta: {
    days: number;
    petType: string | null;
    limit: number;
  };
}

const trendingProductsService = {
  /**
   * Get trending products based on views and sales
   */
  getTrendingProducts: async (params?: {
    limit?: number;
    petType?: string;
    days?: number;
  }): Promise<TrendingProductsResponse> => {
    const response = await api.get<ApiResponse<Product[]>>('/products/trending', {
      params,
    });
    return {
      data: response.data.data,
      meta: (response.data as any).meta || {
        days: params?.days || 7,
        petType: params?.petType || null,
        limit: params?.limit || 20,
      },
    };
  },
};

export default trendingProductsService;


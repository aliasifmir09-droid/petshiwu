import api from './api';
import { Product } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface RecommendationResponse {
  recommendations: Array<{
    product: Product;
    type: string;
    score: number;
    reason?: string;
  }>;
}

interface FrequentlyBoughtTogetherResponse {
  products: Product[];
  frequency: number;
}

export const recommendationService = {
  getRecommendations: async (productId: string): Promise<RecommendationResponse> => {
    const response = await api.get<ApiResponse<RecommendationResponse>>(
      `/products/${productId}/recommendations`
    );
    return response.data.data;
  },

  getFrequentlyBoughtTogether: async (productId: string): Promise<FrequentlyBoughtTogetherResponse> => {
    const response = await api.get<ApiResponse<FrequentlyBoughtTogetherResponse>>(
      `/products/${productId}/frequently-bought-together`
    );
    return response.data.data;
  }
};


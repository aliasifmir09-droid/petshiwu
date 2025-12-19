import api from './api';
import { Product } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface RecommendationProduct extends Product {
  recommendationType?: 'customers_also_bought' | 'frequently_bought_together' | 'personalized' | 'you_may_also_like';
  score?: number;
  orderCount?: number;
}

export const recommendationService = {
  /**
   * Get intelligent product recommendations
   * Returns: "Customers also bought", "Frequently bought together", personalized, and "You may also like"
   */
  getRecommendations: async (productId: string, limit: number = 8): Promise<RecommendationProduct[]> => {
    const response = await api.get<ApiResponse<RecommendationProduct[]>>(
      `/products/${productId}/recommendations`,
      { params: { limit } }
    );
    return response.data.data || [];
  },

  /**
   * Get "Frequently Bought Together" products
   */
  getFrequentlyBoughtTogether: async (productId: string, limit: number = 4): Promise<RecommendationProduct[]> => {
    const response = await api.get<ApiResponse<RecommendationProduct[]>>(
      `/products/${productId}/frequently-bought-together`,
      { params: { limit } }
    );
    return response.data.data || [];
  },

  /**
   * Get "Customers Also Bought" products
   * This is extracted from the main recommendations endpoint
   */
  getCustomersAlsoBought: async (productId: string, limit: number = 8): Promise<RecommendationProduct[]> => {
    const allRecommendations = await recommendationService.getRecommendations(productId, limit * 2);
    return allRecommendations
      .filter((rec) => rec.recommendationType === 'customers_also_bought')
      .slice(0, limit);
  }
};


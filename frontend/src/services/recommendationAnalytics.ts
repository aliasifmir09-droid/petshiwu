import api from './api';
import { ApiResponse } from '@/types';

interface TrackRecommendationClickData {
  productId: string;
  sourceProductId?: string;
  recommendationType: 'frequently-bought-together' | 'customers-also-bought' | 'you-may-also-like' | 'similar-products' | 'trending' | 'personalized';
  position?: number;
}

interface RecommendationAnalytics {
  clickThroughRates: Array<{
    recommendationType: string;
    totalClicks: number;
    uniqueProductsCount: number;
    uniqueUsersCount: number;
    uniqueSessionsCount: number;
    avgPosition: number;
  }>;
  mostClickedProducts: Array<{
    productId: string;
    productName: string;
    productSlug: string;
    totalClicks: number;
    recommendationTypes: string[];
    avgPosition: number;
  }>;
  clicksByPosition: Array<{
    position: number;
    totalClicks: number;
  }>;
  overallStats: {
    totalClicks: number;
    uniqueProductsCount: number;
    uniqueUsersCount: number;
    uniqueSessionsCount: number;
  };
}

const recommendationAnalyticsService = {
  /**
   * Track recommendation click
   */
  trackClick: async (data: TrackRecommendationClickData) => {
    try {
      const response = await api.post<ApiResponse<any>>('/recommendations/track', data);
      return response.data;
    } catch (error) {
      // Silent fail - analytics tracking should not break user experience
      console.debug('Failed to track recommendation click:', error);
      return null;
    }
  },

  /**
   * Get recommendation analytics (admin only)
   */
  getAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
    recommendationType?: string;
    limit?: number;
  }) => {
    const response = await api.get<ApiResponse<RecommendationAnalytics>>('/recommendations/analytics', {
      params,
    });
    return response.data.data;
  },
};

export default recommendationAnalyticsService;


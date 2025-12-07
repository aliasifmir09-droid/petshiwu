import api from './api';
import { Review, PaginatedResponse, ApiResponse } from '@/types';

interface CreateReviewData {
  product: string;
  orderId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export const reviewService = {
  getProductReviews: async (productId: string, page = 1, limit = 10, rating?: number, sort?: string) => {
    const response = await api.get<PaginatedResponse<Review>>(`/reviews/product/${productId}`, {
      params: { page, limit, rating, sort }
    });
    return response.data;
  },

  voteReviewHelpful: async (reviewId: string) => {
    const response = await api.post<ApiResponse<Review>>(`/reviews/${reviewId}/vote`);
    return response.data.data;
  },

  createReview: async (data: CreateReviewData) => {
    const response = await api.post<ApiResponse<Review>>('/reviews', data);
    return response.data.data;
  },

  updateReview: async (id: string, data: Partial<CreateReviewData>) => {
    const response = await api.put<ApiResponse<Review>>(`/reviews/${id}`, data);
    return response.data.data;
  },

  deleteReview: async (id: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/reviews/${id}`);
    return response.data;
  }
};




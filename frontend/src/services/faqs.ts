import api from './api';
import { ApiResponse } from '@/types';

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  petType?: string;
  order: number;
  isPublished: boolean;
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FAQCategory {
  name: string;
  count: number;
}

export interface FAQQueryParams {
  category?: string;
  petType?: string;
  search?: string;
}

export const faqService = {
  /**
   * Get published FAQs
   */
  getFAQs: async (params?: FAQQueryParams): Promise<FAQ[]> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.petType) queryParams.append('petType', params.petType);
    if (params?.search) queryParams.append('search', params.search);

    const response = await api.get<ApiResponse<FAQ[]>>(
      `/faqs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data.data || [];
  },

  /**
   * Get FAQ by ID
   */
  getFAQById: async (id: string): Promise<FAQ> => {
    const response = await api.get<ApiResponse<FAQ>>(`/faqs/${id}`);
    return response.data.data;
  },

  /**
   * Get FAQ categories
   */
  getFAQCategories: async (): Promise<FAQCategory[]> => {
    const response = await api.get<ApiResponse<FAQCategory[]>>('/faqs/categories');
    return response.data.data || [];
  },

  /**
   * Mark FAQ as helpful
   */
  markHelpful: async (id: string): Promise<FAQ> => {
    const response = await api.post<ApiResponse<FAQ>>(`/faqs/${id}/helpful`);
    return response.data.data;
  },

  /**
   * Mark FAQ as not helpful
   */
  markNotHelpful: async (id: string): Promise<FAQ> => {
    const response = await api.post<ApiResponse<FAQ>>(`/faqs/${id}/not-helpful`);
    return response.data.data;
  }
};


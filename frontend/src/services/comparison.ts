import api from './api';
import { Product } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ComparisonResponse {
  products: Product[];
  summary: {
    cheapest: string;
    highestRated: string;
    mostReviewed: string;
    bestValue: string;
  };
}

interface ComparisonSuggestionsResponse {
  suggestions: Product[];
}

export const comparisonService = {
  compareProducts: async (productIds: string[]): Promise<ComparisonResponse> => {
    const response = await api.get<ApiResponse<ComparisonResponse>>(
      `/products/compare`,
      {
        params: {
          productIds: productIds.join(',')
        }
      }
    );
    return response.data.data;
  },

  getSuggestions: async (productIds: string[]): Promise<ComparisonSuggestionsResponse> => {
    const response = await api.get<ApiResponse<ComparisonSuggestionsResponse>>(
      `/products/compare/suggestions`,
      {
        params: {
          productIds: productIds.join(',')
        }
      }
    );
    return response.data.data;
  }
};


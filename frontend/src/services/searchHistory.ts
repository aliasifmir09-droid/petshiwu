import api from './api';

export interface SearchHistoryItem {
  _id: string;
  query: string;
  filters?: {
    category?: string;
    petType?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
  };
  resultsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveSearchHistoryData {
  query: string;
  filters?: {
    category?: string;
    petType?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
  };
  resultsCount?: number;
}

export interface TrackSearchClickData {
  productId: string;
  position?: number;
}

const searchHistoryService = {
  /**
   * Save search history
   */
  saveSearchHistory: async (data: SaveSearchHistoryData) => {
    const response = await api.post('/search/history', data);
    return response.data;
  },

  /**
   * Get search history
   */
  getSearchHistory: async (limit?: number): Promise<{ success: boolean; data: SearchHistoryItem[] }> => {
    const response = await api.get('/search/history', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Delete search history item
   */
  deleteSearchHistory: async (id: string) => {
    const response = await api.delete(`/search/history/${id}`);
    return response.data;
  },

  /**
   * Clear all search history
   */
  clearSearchHistory: async () => {
    const response = await api.delete('/search/history');
    return response.data;
  },

  /**
   * Track search result click
   */
  trackSearchClick: async (id: string, data: TrackSearchClickData) => {
    const response = await api.post(`/search/history/${id}/click`, data);
    return response.data;
  },
};

export default searchHistoryService;


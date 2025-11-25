import api from './api';
import { Product, ApiResponse } from '@/types';

export const wishlistService = {
  addToWishlist: async (productId: string) => {
    const response = await api.post<ApiResponse<string[]>>('/users/wishlist', { productId });
    return response.data;
  },

  removeFromWishlist: async (productId: string) => {
    const response = await api.delete<ApiResponse<string[]>>('/users/wishlist', { data: { productId } });
    return response.data;
  },

  getWishlist: async () => {
    const response = await api.get<ApiResponse<Product[]>>('/users/wishlist');
    return response.data.data;
  }
};


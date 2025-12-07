import api from './api';
import { Product } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface StockAlert {
  _id: string;
  productId: Product;
  userId: string;
  createdAt: string;
}

export const stockAlertService = {
  createStockAlert: async (productId: string): Promise<StockAlert> => {
    const response = await api.post<ApiResponse<StockAlert>>('/users/stock-alerts', {
      productId
    });
    return response.data.data;
  },

  getMyStockAlerts: async (): Promise<StockAlert[]> => {
    const response = await api.get<ApiResponse<StockAlert[]>>('/users/stock-alerts');
    return response.data.data;
  },

  deleteStockAlert: async (productId: string): Promise<void> => {
    await api.delete(`/users/stock-alerts/${productId}`);
  }
};


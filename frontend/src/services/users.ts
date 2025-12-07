import api from './api';
import { ApiResponse } from '@/types';

export interface Address {
  _id?: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface StockAlert {
  _id: string;
  product: any;
  user: string;
  createdAt: string;
}

export interface WishlistShare {
  shareToken: string;
  shareUrl: string;
  expiresAt: string;
}

export const userService = {
  getAddresses: async () => {
    const response = await api.get<ApiResponse<Address[]>>('/users/addresses');
    return response.data.data;
  },

  addAddress: async (address: Omit<Address, '_id'>) => {
    const response = await api.post<ApiResponse<Address>>('/users/addresses', address);
    return response.data.data;
  },

  updateAddress: async (addressId: string, address: Partial<Address>) => {
    const response = await api.put<ApiResponse<Address>>(`/users/addresses/${addressId}`, address);
    return response.data.data;
  },

  deleteAddress: async (addressId: string) => {
    const response = await api.delete<ApiResponse<void>>(`/users/addresses/${addressId}`);
    return response.data;
  },

  getStockAlerts: async () => {
    const response = await api.get<ApiResponse<StockAlert[]>>('/users/stock-alerts');
    return response.data.data;
  },

  createStockAlert: async (productId: string) => {
    const response = await api.post<ApiResponse<StockAlert>>('/users/stock-alerts', { productId });
    return response.data.data;
  },

  removeStockAlert: async (productId: string) => {
    const response = await api.delete<ApiResponse<void>>(`/users/stock-alerts/${productId}`);
    return response.data;
  },

  shareWishlist: async () => {
    const response = await api.get<ApiResponse<WishlistShare>>('/users/wishlist/share');
    return response.data.data;
  },

  emailWishlist: async (email: string, message?: string) => {
    const response = await api.post<ApiResponse<void>>('/users/wishlist/email', { email, message });
    return response.data;
  },

  getSharedWishlist: async (userId: string, token?: string) => {
    const params = token ? { token } : {};
    const response = await api.get<ApiResponse<any>>(`/users/wishlist/${userId}`, { params });
    return response.data.data;
  }
};


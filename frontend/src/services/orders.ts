import api from './api';
import { Order, PaginatedResponse, ApiResponse, OrderItem, ShippingAddress } from '@/types';

interface CreateOrderData {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cod';
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  donationAmount?: number;
  totalPrice: number;
}

export const orderService = {
  createOrder: async (data: CreateOrderData) => {
    const response = await api.post<ApiResponse<Order>>('/orders', data);
    return response.data.data;
  },

  getMyOrders: async (page = 1, limit = 10) => {
    const response = await api.get<PaginatedResponse<Order>>('/orders/myorders', {
      params: { page, limit }
    });
    return response.data;
  },

  getOrder: async (id: string) => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },

  cancelOrder: async (id: string) => {
    const response = await api.put<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return response.data;
  },

  trackOrder: async (id: string) => {
    // Public endpoint - no auth required
    // Create a new axios instance without interceptors for public requests
    const axios = (await import('axios')).default;
    let apiUrl = import.meta.env.VITE_API_URL || '/api';
    apiUrl = apiUrl.replace(/\/+$/, '');
    if (apiUrl.startsWith('http') && !apiUrl.endsWith('/api')) {
      apiUrl = `${apiUrl}/api`;
    }
    apiUrl = apiUrl.replace(/\/+$/, '');
    
    const response = await axios.get<ApiResponse<Order>>(`${apiUrl}/orders/track/${id}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    return response.data.data;
  }
};




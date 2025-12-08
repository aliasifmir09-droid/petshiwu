import api from './api';
import { Order, PaginatedResponse, ApiResponse, OrderItem, ShippingAddress } from '@/types';

interface CreateOrderData {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cod';
  paymentIntentId?: string;
  paypalOrderId?: string;
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
    // Helper to extract order ID as string
    const extractId = (idValue: any): string => {
      if (!idValue) return '';
      if (typeof idValue === 'string') return idValue.trim();
      if (typeof idValue === 'object' && idValue !== null) {
        // Try toString() method
        if (typeof idValue.toString === 'function') {
          const str = idValue.toString();
          if (str && str !== '[object Object]') return str.trim();
        }
        // Try _id property
        if (idValue._id) return String(idValue._id).trim();
        // Try id property
        if (idValue.id) return String(idValue.id).trim();
      }
      const str = String(idValue).trim();
      return str === '[object Object]' ? '' : str;
    };
    
    const orderId = extractId(id);
    if (!orderId || orderId === '[object Object]') {
      throw new Error('Invalid order ID format');
    }
    const response = await api.get<ApiResponse<Order>>(`/orders/${encodeURIComponent(orderId)}`);
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
  },

  createPaymentIntent: async (data: { totalPrice: number; paymentMethod: string }) => {
    const response = await api.post<ApiResponse<{ clientSecret: string; paymentIntentId: string }>>('/orders/payment-intent', data);
    return response.data;
  },

  confirmPayment: async (paymentIntentId: string) => {
    const response = await api.post<ApiResponse<{ paymentStatus: string; paymentIntentId: string; amount: number }>>('/orders/confirm-payment', { paymentIntentId });
    return response.data;
  }
};




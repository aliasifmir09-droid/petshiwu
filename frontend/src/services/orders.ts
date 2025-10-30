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
  }
};




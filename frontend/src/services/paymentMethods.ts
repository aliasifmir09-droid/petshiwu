import api from './api';
import { ApiResponse } from '@/types';

export interface PaymentMethod {
  _id: string;
  type: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  billingAddress?: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface SavePaymentMethodData {
  type: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  stripePaymentMethodId?: string;
  paypalAccountId?: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
  billingAddress?: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const paymentMethodService = {
  getPaymentMethods: async () => {
    const response = await api.get<ApiResponse<PaymentMethod[]>>('/payment-methods');
    return response.data;
  },

  getDefaultPaymentMethod: async () => {
    const response = await api.get<ApiResponse<PaymentMethod | null>>('/payment-methods/default');
    return response.data;
  },

  savePaymentMethod: async (data: SavePaymentMethodData) => {
    const response = await api.post<ApiResponse<PaymentMethod>>('/payment-methods', data);
    return response.data;
  },

  updatePaymentMethod: async (id: string, data: { isDefault?: boolean; billingAddress?: SavePaymentMethodData['billingAddress'] }) => {
    const response = await api.put<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`, data);
    return response.data;
  },

  deletePaymentMethod: async (id: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/payment-methods/${id}`);
    return response.data;
  },
};

export default paymentMethodService;


import api from './api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ReturnItem {
  orderItemId: string;
  productId: string;
  quantity: number;
  reason: string;
}

export interface ReturnRequest {
  orderId: string;
  items: ReturnItem[];
  reason: string;
  returnAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
}

export interface Return {
  _id: string;
  orderId: string;
  userId: string;
  items: Array<{
    orderItemId: string;
    productId: {
      _id: string;
      name: string;
      image: string;
      slug: string;
    };
    quantity: number;
    reason: string;
    refundAmount: number;
  }>;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled';
  refundStatus: 'pending' | 'processing' | 'refunded' | 'failed';
  refundAmount: number;
  refundMethod: 'original' | 'store_credit';
  rmaNumber?: string;
  returnNumber?: string;
  returnAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const returnService = {
  createReturn: async (returnRequest: ReturnRequest): Promise<Return> => {
    const response = await api.post<ApiResponse<Return>>('/orders/returns', returnRequest);
    return response.data.data;
  },

  getMyReturns: async (): Promise<Return[]> => {
    const response = await api.get<ApiResponse<Return[]>>('/orders/returns/my');
    return response.data.data;
  },

  getReturn: async (returnId: string): Promise<Return> => {
    const response = await api.get<ApiResponse<Return>>(`/orders/returns/${returnId}`);
    return response.data.data;
  }
};


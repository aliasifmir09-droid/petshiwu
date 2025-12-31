import api from './api';

export interface CartItem {
  product: string;
  variant?: {
    sku?: string;
    size?: string;
    weight?: string;
    attributes?: Record<string, string>;
  };
  quantity: number;
  price: number;
  name: string;
  image?: string;
}

export interface CartResponse {
  success: boolean;
  data: {
    cartId?: string;
    shareId?: string;
    items: CartItem[];
    lastUpdated?: string;
  };
}

export interface DeliveryEstimate {
  success: boolean;
  data: {
    estimatedDelivery: string;
    shippingMethod: string;
  };
}

export const cartService = {
  /**
   * Save or update cart
   */
  saveCart: async (items: CartItem[], shareId?: string): Promise<CartResponse> => {
    const response = await api.post('/cart', { items, shareId });
    return response.data;
  },

  /**
   * Get current user's cart
   */
  getCart: async (): Promise<CartResponse> => {
    const response = await api.get('/cart');
    return response.data;
  },

  /**
   * Get shared cart by share ID
   */
  getSharedCart: async (shareId: string): Promise<CartResponse> => {
    const response = await api.get(`/cart/share/${shareId}`);
    return response.data;
  },

  /**
   * Clear cart
   */
  clearCart: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/cart');
    return response.data;
  },

  /**
   * Get estimated delivery date
   */
  getDeliveryEstimate: async (shippingMethod: string = 'standard'): Promise<DeliveryEstimate> => {
    const response = await api.get('/cart/delivery-estimate', {
      params: { shippingMethod }
    });
    return response.data;
  }
};

export default cartService;


import api from './api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface WishlistShareLink {
  shareUrl: string;
  shareToken: string;
  expiresAt: string;
}

export interface WishlistEmailRequest {
  recipientEmail: string;
  message?: string;
}

export const wishlistShareService = {
  getShareLink: async (): Promise<WishlistShareLink> => {
    const response = await api.get<ApiResponse<WishlistShareLink>>('/users/wishlist/share');
    return response.data.data;
  },

  emailWishlist: async (request: WishlistEmailRequest): Promise<void> => {
    await api.post('/users/wishlist/email', request);
  }
};


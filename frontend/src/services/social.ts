import api from './api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface SocialShareLinks {
  facebook: string;
  twitter: string;
  pinterest: string;
  linkedin: string;
  whatsapp: string;
  email: string;
  copyLink: string;
}

export const socialService = {
  getProductShareLinks: async (productId: string): Promise<SocialShareLinks> => {
    const response = await api.get<ApiResponse<SocialShareLinks>>(`/products/${productId}/share`);
    return response.data.data;
  }
};


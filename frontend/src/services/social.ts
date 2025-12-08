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

export interface SocialShareData {
  product: {
    name: string;
    url: string;
    image: string;
  };
  shareLinks: SocialShareLinks;
}

export const socialService = {
  getProductShareLinks: async (productId: string): Promise<SocialShareLinks> => {
    const response = await api.get<ApiResponse<SocialShareData>>(`/products/${productId}/share`);
    // Return only the shareLinks part, not the whole data object
    return response.data.data.shareLinks;
  }
};


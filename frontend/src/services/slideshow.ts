import api from './api';

export interface Slide {
  _id: string;
  id: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  leftImage: string;
  imageUrl: string;
  backgroundColor?: string;
  theme: 'holiday' | 'product' | 'wellness' | 'treats' | 'custom';
  isActive: boolean;
  order: number;
}

export const slideshowService = {
  getActiveSlides: async (): Promise<Slide[]> => {
    const response = await api.get<{ success: boolean; data: Slide[] }>('/slideshow/active');
    return response.data.data;
  }
};


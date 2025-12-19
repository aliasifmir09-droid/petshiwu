import api from './api';
import { ApiResponse } from '@/types';

export interface CareGuide {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  petType: string;
  category: string;
  author: {
    _id: string;
    name?: string;
    email: string;
  };
  tags: string[];
  isPublished: boolean;
  publishedAt?: string;
  views: number;
  readingTime?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  sections?: Array<{
    title: string;
    content: string;
    order: number;
  }>;
  relatedProducts?: Array<{
    _id: string;
    name: string;
    slug: string;
    images?: string[];
    basePrice: number;
    inStock: boolean;
  }>;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CareGuideCategory {
  name: string;
  count: number;
}

export interface CareGuideQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  petType?: string;
  category?: string;
  difficulty?: string;
}

export interface CareGuidesResponse {
  data: CareGuide[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const careGuideService = {
  getCareGuides: async (params?: CareGuideQueryParams): Promise<CareGuidesResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.petType) queryParams.append('petType', params.petType);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);

    const response = await api.get<ApiResponse<CareGuidesResponse>>(
      `/care-guides?${queryParams.toString()}`
    );
    return response.data.data;
  },

  getCareGuideBySlug: async (slug: string): Promise<CareGuide> => {
    const response = await api.get<ApiResponse<CareGuide>>(`/care-guides/${slug}`);
    return response.data.data;
  },

  getCareGuideCategories: async (petType?: string): Promise<CareGuideCategory[]> => {
    const params = petType ? `?petType=${petType}` : '';
    const response = await api.get<ApiResponse<CareGuideCategory[]>>(
      `/care-guides/categories${params}`
    );
    return response.data.data;
  }
};


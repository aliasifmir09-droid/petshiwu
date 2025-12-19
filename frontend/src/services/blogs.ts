import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';

export interface Blog {
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
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategory {
  name: string;
  count: number;
}

export const blogService = {
  getBlogs: async (params?: {
    petType?: string;
    category?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const response = await api.get<PaginatedResponse<Blog>>('/blogs', {
      params
    });
    return response.data;
  },

  getBlog: async (slug: string) => {
    const response = await api.get<ApiResponse<Blog>>(`/blogs/${slug}`);
    return response.data.data;
  },

  getBlogCategories: async (petType?: string) => {
    const response = await api.get<ApiResponse<BlogCategory[]>>('/blogs/categories', {
      params: petType ? { petType } : {}
    });
    return response.data.data;
  }
};


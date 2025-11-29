import api from './api';
import { Category, ApiResponse } from '@/types';

export const categoryService = {
  getCategories: async (petType?: string) => {
    const response = await api.get<ApiResponse<Category[]>>('/categories', {
      params: petType ? { petType } : {}
    });
    return response.data.data;
  },

  getCategory: async (id: string, petType?: string) => {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`, {
      params: petType ? { petType } : {}
    });
    return response.data.data;
  }
};




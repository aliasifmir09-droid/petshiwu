import api from './api';
import { User, ApiResponse } from '@/types';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export const authService = {
  register: async (data: RegisterData) => {
    const response = await api.post<any>('/auth/register', data);
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await api.post<any>('/auth/login', data);
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },

  getMe: async () => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.put<ApiResponse<User>>('/auth/updateprofile', data);
    return response.data.data;
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put<any>('/auth/updatepassword', {
      currentPassword,
      newPassword
    });
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }
};




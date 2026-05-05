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

// Token storage helpers for mobile fallback
const TOKEN_KEY = 'auth_token';

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
};

export const clearStoredToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

export const authService = {
  register: async (data: RegisterData) => {
    const response = await api.post<any>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await api.post<any>('/auth/login', data);
    // Save token to localStorage as fallback for mobile (cookie may be blocked)
    if (response.data?.token) {
      setStoredToken(response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    clearStoredToken();
    await api.post('/auth/logout');
  },

  getMe: async (skipAuth = false) => {
    const response = await api.get<ApiResponse<User>>('/auth/me', { skipAuth } as any);
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
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.get<any>('/auth/verify-email', {
      params: { token }
    });
    return response.data;
  },

  resendVerification: async (email: string) => {
    const response = await api.post<any>('/auth/resend-verification', { email });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<any>('/auth/forgot-password', { email });
    return response.data;
  },

  verifyResetToken: async (token: string) => {
    const response = await api.get<any>('/auth/verify-reset-token', {
      params: { token }
    });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post<any>('/auth/reset-password', { token, password });
    return response.data;
  }
};

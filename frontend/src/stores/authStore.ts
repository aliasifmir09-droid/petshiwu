import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: async () => {
    try {
      // Phase 1: Dual Support - Call logout endpoint to clear httpOnly cookie
      // Also clear localStorage for backward compatibility
      const { default: api } = await import('@/services/api');
      await api.post('/auth/logout');
    } catch (error) {
      // If logout endpoint fails, still clear local state
      console.error('Logout error:', error);
    } finally {
      // Always clear localStorage and local state
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false });
      // Reload the page after logout to clear all state
      window.location.href = '/';
    }
  }
}));




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
      // Phase 2: Cookie-Only - Call logout endpoint to clear httpOnly cookie
      // Backend handles cookie clearing, no localStorage to manage
      const { default: api } = await import('@/services/api');
      await api.post('/auth/logout');
    } catch (error) {
      // If logout endpoint fails, still clear local state
      console.error('Logout error:', error);
    } finally {
      // Clear local state immediately (no localStorage token to remove)
      set({ user: null, isAuthenticated: false });
      // Use window.location.replace to prevent back button from restoring state
      // Add a small delay to ensure cookie is cleared before redirect
      setTimeout(() => {
        window.location.replace('/');
      }, 100);
    }
  }
}));




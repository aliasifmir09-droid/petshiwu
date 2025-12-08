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
      // Clear local state first to prevent any redirect loops
      set({ user: null, isAuthenticated: false });
      // Call logout endpoint
      await api.post('/auth/logout', {}, { skipAuth: true }).catch(() => {
        // Ignore errors - cookie clearing is best effort
      });
    } catch (error) {
      // If logout endpoint fails, still clear local state
      console.error('Logout error:', error);
      set({ user: null, isAuthenticated: false });
    } finally {
      // Use hash-based navigation for React Router instead of window.location
      // This prevents infinite redirect loops
      if (window.location.hash !== '#/') {
        window.location.hash = '/';
      } else {
        // If already on home, force a reload to clear state
        window.location.reload();
      }
    }
  }
}));




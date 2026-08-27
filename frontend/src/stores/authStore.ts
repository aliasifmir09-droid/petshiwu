import { create } from 'zustand';
import { User } from '@/types';
import { touchCustomerActivity } from '@/utils/sessionTimeout';

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
  setUser: (user) => {
    if (user) touchCustomerActivity();
    set({ user, isAuthenticated: !!user, isLoading: false });
  },
  setLoading: (loading) => set({ isLoading: loading }),
  logout: async () => {
    // Clear local state immediately to prevent any redirect loops
    set({ user: null, isAuthenticated: false });
    
    try {
      const { default: api, removeToken } = await import('@/services/api');
      removeToken();
      await api.post('/auth/logout', {}, { skipAuth: true }).catch(() => {
        // Ignore errors - cookie clearing is best effort, state already cleared
      });
    } catch (error) {
      // If logout endpoint fails, state is already cleared above
    }
    
    // Use pathname navigation (BrowserRouter handles it)
    // Small delay to ensure cookie is cleared
    setTimeout(() => {
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }, 50);
  }
}));




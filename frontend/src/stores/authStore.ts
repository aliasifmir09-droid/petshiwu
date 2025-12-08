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
    // Clear local state immediately to prevent any redirect loops
    set({ user: null, isAuthenticated: false });
    
    try {
      // Phase 2: Cookie-Only - Call logout endpoint to clear httpOnly cookie
      // Backend handles cookie clearing, no localStorage to manage
      const { default: api } = await import('@/services/api');
      // Call logout endpoint with skipAuth to prevent 401 redirects
      await api.post('/auth/logout', {}, { skipAuth: true }).catch(() => {
        // Ignore errors - cookie clearing is best effort, state already cleared
      });
    } catch (error) {
      // If logout endpoint fails, state is already cleared above
      // Silently continue - user is already logged out locally
    }
    
    // Use hash navigation to home page - no full page reload to prevent loops
    // Small delay to ensure cookie is cleared
    setTimeout(() => {
      if (window.location.hash !== '#/') {
        window.location.hash = '/';
      }
    }, 50);
  }
}));




import { create } from 'zustand';
import { User } from '@/types';
import { touchCustomerActivity } from '@/utils/sessionTimeout';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: (options?: { redirect?: boolean }) => void;
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
  logout: async (options?: { redirect?: boolean }) => {
    set({ user: null, isAuthenticated: false, isLoading: false });

    try {
      const { clearCustomerActivity } = await import('@/utils/sessionTimeout');
      clearCustomerActivity();
    } catch {
      // ignore
    }

    try {
      const { default: api, removeToken } = await import('@/services/api');
      removeToken();
      await api.post('/auth/logout', {}, { skipAuth: true }).catch(() => {
        // Ignore errors - cookie clearing is best effort, state already cleared
      });
    } catch {
      // If logout endpoint fails, state is already cleared above
    }

    // Idle timeout must not navigate — a hidden-tab redirect painted a white page.
    if (options?.redirect === false) return;
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.assign('/');
    }
  }
}));




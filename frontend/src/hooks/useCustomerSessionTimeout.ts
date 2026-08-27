import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  CUSTOMER_AWAY_TIMEOUT_MS,
  readLastActiveAt,
  shouldExpireCustomerSession,
  touchCustomerActivity
} from '@/utils/sessionTimeout';

/**
 * Log the customer out if they leave the tab/page for 1 minute.
 * Do not hard-redirect or log out while the tab is hidden — that left a white
 * screen when people came back. Expire in place after they return.
 */
export const useCustomerSessionTimeout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!isAuthenticated) return;

    const expireQuietly = () => {
      if (!useAuthStore.getState().isAuthenticated) return;
      if (shouldExpireCustomerSession(readLastActiveAt(), Date.now())) {
        logout({ redirect: false });
      }
    };

    const markActive = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      touchCustomerActivity();
    };

    const onVisibility = () => {
      if (document.hidden) return;
      expireQuietly();
      if (useAuthStore.getState().isAuthenticated) markActive();
    };

    markActive();

    const heartbeat = setInterval(markActive, 15 * 1000);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [isAuthenticated, logout]);
};

export { CUSTOMER_AWAY_TIMEOUT_MS };

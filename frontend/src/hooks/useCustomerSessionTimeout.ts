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
 * Staying on the shop keeps the session alive with a heartbeat.
 */
export const useCustomerSessionTimeout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!isAuthenticated) return;

    let awayTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    const clearAwayTimer = () => {
      if (awayTimer) {
        clearTimeout(awayTimer);
        awayTimer = null;
      }
    };

    const expireIfNeeded = () => {
      if (!useAuthStore.getState().isAuthenticated) return;
      if (shouldExpireCustomerSession(readLastActiveAt(), Date.now())) {
        logout();
      }
    };

    const startAwayTimer = () => {
      touchCustomerActivity();
      clearAwayTimer();
      awayTimer = setTimeout(() => {
        if (typeof document !== 'undefined' && document.hidden) {
          expireIfNeeded();
        }
      }, CUSTOMER_AWAY_TIMEOUT_MS);
    };

    const markActive = () => {
      touchCustomerActivity();
      clearAwayTimer();
    };

    const onVisibility = () => {
      if (document.hidden) {
        startAwayTimer();
        return;
      }
      expireIfNeeded();
      markActive();
    };

    expireIfNeeded();
    if (useAuthStore.getState().isAuthenticated) markActive();

    heartbeat = setInterval(() => {
      if (!document.hidden) touchCustomerActivity();
    }, 15 * 1000);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', startAwayTimer);
    window.addEventListener('focus', markActive);

    return () => {
      clearAwayTimer();
      if (heartbeat) clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', startAwayTimer);
      window.removeEventListener('focus', markActive);
    };
  }, [isAuthenticated, logout]);
};

/**
 * Suppress browser network error logs for expected 401/403 errors
 * This prevents console spam from authentication checks
 */

const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

/**
 * Suppress 401/403 network errors in browser console
 * These are expected when users are not authenticated
 */
export const suppressNetworkErrors = () => {
  if (typeof window === 'undefined') return;

  // Override console methods to filter out 401/403 errors
  const originalError = console.error;
  const originalWarn = console.warn;

  // Filter console.error for network-related 401/403 errors
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Check if this is a 401/403 network error
    const is401Error = message.includes('401') && (
      message.includes('Unauthorized') ||
      message.includes('/api/auth/me') ||
      message.includes('/auth/me') ||
      message.includes('pet-shop-backend') && message.includes('/auth/me')
    );
    
    const is403Error = message.includes('403') && (
      message.includes('Forbidden') ||
      message.includes('/api/')
    );

    // In production, suppress expected 401/403 errors
    // In development, show them but mark as expected
    if (is401Error || is403Error) {
      if (isProduction) {
        // Suppress in production - these are expected
        return;
      } else {
        // In development, show but mark as expected
        originalWarn('[Expected Network Error - User Not Authenticated]', ...args);
        return;
      }
    }

    // Pass through all other errors
    originalError.apply(console, args);
  };

  // Also intercept fetch/XHR errors via global error handler
  window.addEventListener('error', (event) => {
    // Suppress network errors for 401/403
    if (event.message && (
      event.message.includes('401') ||
      event.message.includes('403') ||
      event.message.includes('Unauthorized') ||
      event.message.includes('Forbidden')
    )) {
      // Check if it's related to auth endpoints
      if (event.message.includes('/api/auth/') || event.message.includes('/auth/me')) {
        if (isProduction) {
          event.preventDefault();
          return false;
        }
      }
    }
  }, true);

  // Intercept unhandled promise rejections for network errors
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || String(reason || '');
    const status = reason?.response?.status || reason?.status;

    // Suppress 401/403 promise rejections from auth endpoints
    if ((status === 401 || status === 403) && (
      message.includes('/api/auth/') ||
      message.includes('/auth/me') ||
      reason?.config?.url?.includes('/auth/me')
    )) {
      if (isProduction) {
        event.preventDefault();
        return false;
      } else {
        // In development, mark as expected
        console.warn('[Expected] Unhandled rejection (401/403):', message);
        event.preventDefault();
        return false;
      }
    }
  });
};


import axios from 'axios';

// Extend AxiosRequestConfig to include our custom skipAuth property
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

// Use environment variable for API URL, fallback to relative path for local dev
// Normalize the URL: remove trailing slashes and ensure /api is included
let API_URL = import.meta.env.VITE_API_URL || '/api';
// Remove all trailing slashes
API_URL = API_URL.replace(/\/+$/, '');
// If it's a full URL and doesn't end with /api, add it
if (API_URL.startsWith('http') && !API_URL.endsWith('/api')) {
  API_URL = `${API_URL}/api`;
}
// Final cleanup: ensure no trailing slash (axios will handle paths that start with /)
API_URL = API_URL.replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add token to requests
// Phase 2: Cookie-Only - Rely solely on httpOnly cookies
// Cookies are sent automatically via withCredentials: true
// No Authorization header needed - backend only accepts cookies
api.interceptors.request.use(
  (config: any) => {
    // Skip auth if skipAuth flag is set
    if (!config.skipAuth) {
      // Phase 2: No Authorization header - httpOnly cookies sent automatically
      // Backend only accepts tokens from httpOnly cookies (more secure)
      // withCredentials: true ensures cookies are sent with all requests
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    // Phase 2: Cookie-Only - Ensure response structure is consistent
    // Some analytics/wrapper code might expect a token field, but we don't return it anymore
    // The cookie is set automatically by the browser, so we just return the response as-is
    return response;
  },
  (error) => {
    // Don't redirect for certain endpoints that might legitimately return 404
    const url = error.config?.url || '';
    const isWishlistEndpoint = url.includes('/wishlist');
    const isProductEndpoint = url.includes('/products/');
    const skipAuth = error.config?.skipAuth;
    const isAuthMeEndpoint = url.includes('/auth/me');
    
    if (error.response?.status === 401) {
      // Phase 2: No localStorage token to remove - cookies are cleared by backend on logout
      // Only redirect if not already on login/register pages and not a public endpoint
      // Also skip redirect if this is a logout request (skipAuth flag)
      const isPublicEndpoint = url.includes('/auth/login') || 
                               url.includes('/auth/register') || 
                               url.includes('/auth/forgot-password') ||
                               url.includes('/auth/reset-password') ||
                               url.includes('/auth/logout') ||
                               url.includes('/products') ||
                               url.includes('/categories');
      
      // For /auth/me endpoint with skipAuth, silently handle 401 (expected when not logged in)
      // This prevents browser network logs from showing 401 errors
      if (isAuthMeEndpoint && skipAuth) {
        // Silently handle - this is expected when user is not authenticated
        return Promise.reject(error);
      }
      
      // Don't redirect if skipAuth flag is set (e.g., during logout or initial load)
      // Only redirect if:
      // 1. Not a skipAuth request (e.g., logout)
      // 2. Not a public endpoint
      // 3. Not already on login/register/home pages
      // 4. Not during a navigation (check if we're in the middle of a redirect)
      // Use a more secure key name and add timestamp to prevent stale flags
      const navKey = '_nav_' + Date.now();
      const isNavigating = sessionStorage.getItem('_isNavigating') === 'true';
      const navTimestamp = sessionStorage.getItem('_navTimestamp');
      const isStale = navTimestamp && (Date.now() - parseInt(navTimestamp)) > 5000; // 5 second timeout
      
      if (!skipAuth && 
          !isPublicEndpoint && 
          !(isNavigating && !isStale) &&
          window.location.pathname !== '/login' && 
          window.location.pathname !== '/register' &&
          window.location.pathname !== '/') {
        // Mark that we're navigating to prevent loops (with timestamp)
        sessionStorage.setItem('_isNavigating', 'true');
        sessionStorage.setItem('_navTimestamp', Date.now().toString());
        
        // Clear any stale auth state (use dynamic import without await since we're in a non-async function)
        import('@/stores/authStore').then(({ useAuthStore }) => {
          useAuthStore.getState().setUser(null);
        });
        
        // Use pathname navigation (BrowserRouter handles it)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        // Clear navigation flag after a short delay
        setTimeout(() => {
          sessionStorage.removeItem('_isNavigating');
          sessionStorage.removeItem('_navTimestamp');
        }, 1000);
      }
    } else if (error.response?.status === 403) {
      // Don't redirect for order endpoints - let the component handle the error
      const isOrderEndpoint = url.includes('/orders/');
      if (!isOrderEndpoint) {
        // Redirect to 403 page for other endpoints
        window.location.href = '/403';
      }
    } else if (error.response?.status === 404 && !isWishlistEndpoint && !isProductEndpoint) {
      // Only redirect to 404 page for non-resource endpoints
      // Wishlist and product endpoints might legitimately return 404
      window.location.href = '/404';
    }
    return Promise.reject(error);
  }
);

export { API_URL };
export default api;




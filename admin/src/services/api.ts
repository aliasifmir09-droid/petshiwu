import axios from 'axios';

// Extend AxiosRequestConfig to include our custom skipAuth property
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

// Use relative URL to leverage Vite proxy in development
// Normalize the URL: remove trailing slashes and ensure /api is included
let API_URL = import.meta.env.VITE_API_URL || '/api';
// Remove trailing slash if present
API_URL = API_URL.replace(/\/+$/, '');
// If it's a full URL and doesn't end with /api, add it
if (API_URL.startsWith('http') && !API_URL.endsWith('/api')) {
  API_URL = `${API_URL}/api`;
}


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Phase 2: Cookie-Only - Rely solely on httpOnly cookies
// Cookies are sent automatically via withCredentials: true
// No Authorization header needed - backend only accepts cookies
api.interceptors.request.use(
  (config) => {
    // Phase 2: No Authorization header - httpOnly cookies sent automatically
    // Backend only accepts tokens from httpOnly cookies (more secure)
    // withCredentials: true ensures cookies are sent with all requests
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout on 401 (Unauthorized - invalid/expired cookie)
    // Do NOT logout on 403 (Forbidden - valid cookie but insufficient permissions)
    if (error.response?.status === 401) {
      // Phase 2: No localStorage token to remove - cookies are cleared by backend on logout
      // Only redirect if not already on login page and not during logout
      const url = error.config?.url || '';
      const isLogoutEndpoint = url.includes('/auth/logout');
      const isLoginEndpoint = url.includes('/auth/login');
      const pathname = window.location.pathname;
      const isLoginPage = pathname === '/login' || pathname === '/login/' || pathname.startsWith('/login');
      
      // Don't redirect if:
      // 1. Already on login page
      // 2. This is a logout request
      // 3. This is a login request (login can fail with 401 for invalid credentials)
      // 4. Request has skipAuth flag (e.g., during logout or auth check on login page)
      const skipAuth = (error.config as any)?.skipAuth;
      
      if (!skipAuth && !isLogoutEndpoint && !isLoginEndpoint && !isLoginPage) {
        // Prevent multiple redirects by checking if we're already navigating
        const isNavigating = sessionStorage.getItem('adminNavigating') === 'true';
        if (!isNavigating) {
          sessionStorage.setItem('adminNavigating', 'true');
          window.location.href = '/login';
          // Clear flag after a short delay
          setTimeout(() => sessionStorage.removeItem('adminNavigating'), 1000);
        }
      }
    }
    return Promise.reject(error);
  }
);

export { API_URL };
export default api;




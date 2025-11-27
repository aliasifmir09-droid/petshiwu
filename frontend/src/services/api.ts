import axios from 'axios';

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
api.interceptors.request.use(
  (config: any) => {
    // Skip auth if skipAuth flag is set
    if (!config.skipAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect for certain endpoints that might legitimately return 404
    const url = error.config?.url || '';
    const isWishlistEndpoint = url.includes('/wishlist');
    const isProductEndpoint = url.includes('/products/');
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login or reload if already on login page
      if (window.location.hash !== '#/login' && window.location.hash !== '#/register') {
        window.location.href = '/#/login';
      }
    } else if (error.response?.status === 403) {
      // Don't redirect for order endpoints - let the component handle the error
      const isOrderEndpoint = url.includes('/orders/');
      if (!isOrderEndpoint) {
        // Redirect to 403 page for other endpoints
        window.location.href = '/#/403';
      }
    } else if (error.response?.status === 404 && !isWishlistEndpoint && !isProductEndpoint) {
      // Only redirect to 404 page for non-resource endpoints
      // Wishlist and product endpoints might legitimately return 404
      window.location.href = '/#/404';
    }
    return Promise.reject(error);
  }
);

export { API_URL };
export default api;




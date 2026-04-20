import axios from 'axios';

// Extend AxiosRequestConfig to include our custom skipAuth property
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

// Use environment variable for API URL, fallback to relative path for local dev
let API_URL = import.meta.env.VITE_API_URL || '/api';
API_URL = API_URL.replace(/\/+$/, '');
if (API_URL.startsWith('http') && !API_URL.endsWith('/api')) {
  API_URL = `${API_URL}/api`;
}
API_URL = API_URL.replace(/\/+$/, '');

// FIX: Token storage helpers - store token in localStorage as cross-domain fallback
const TOKEN_KEY = 'petshiwu_token';

export const saveToken = (token: string) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Keep for cookie support
});

// FIX: Add Authorization header from localStorage token as cross-domain fallback
// Cookies get rejected when backend (onrender.com) and frontend (petshiwu.com) are on different domains
// Using Authorization header with localStorage token solves this completely
api.interceptors.request.use(
  (config: any) => {
    if (!config.skipAuth) {
      const token = getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// FIX: Capture token from login/register responses and save to localStorage
api.interceptors.response.use(
  (response) => {
    // If backend returns a token in response body, save it
    if (response.data?.token) {
      saveToken(response.data.token);
    }
    return response;
  },
  (error) => {
    const url = error.config?.url || '';
    const isWishlistEndpoint = url.includes('/wishlist');
    const isProductEndpoint = url.includes('/products/');
    const skipAuth = error.config?.skipAuth;
    const isAuthMeEndpoint = url.includes('/auth/me');
    
    if (error.response?.status === 401) {
      const isPublicEndpoint = url.includes('/auth/login') || 
                               url.includes('/auth/register') || 
                               url.includes('/auth/forgot-password') ||
                               url.includes('/auth/reset-password') ||
                               url.includes('/auth/logout') ||
                               url.includes('/products') ||
                               url.includes('/categories');
      
      if (isAuthMeEndpoint && skipAuth) {
        return Promise.reject(error);
      }
      
      const isNavigating = sessionStorage.getItem('_isNavigating') === 'true';
      const navTimestamp = sessionStorage.getItem('_navTimestamp');
      const isStale = navTimestamp && (Date.now() - parseInt(navTimestamp)) > 5000;
      
      if (!skipAuth && 
          !isPublicEndpoint && 
          !(isNavigating && !isStale) &&
          window.location.pathname !== '/login' && 
          window.location.pathname !== '/register' &&
          window.location.pathname !== '/') {
        sessionStorage.setItem('_isNavigating', 'true');
        sessionStorage.setItem('_navTimestamp', Date.now().toString());
        
        // FIX: Clear token from localStorage on 401
        removeToken();
        
        import('@/stores/authStore').then(({ useAuthStore }) => {
          useAuthStore.getState().setUser(null);
        });
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        setTimeout(() => {
          sessionStorage.removeItem('_isNavigating');
          sessionStorage.removeItem('_navTimestamp');
        }, 1000);
      }
    } else if (error.response?.status === 403) {
      const isAuthLogin = url.includes('/auth/login');
      const requiresVerification = error.response?.data?.requiresVerification;
      const isOrderEndpoint = url.includes('/orders/');
      if (!isOrderEndpoint && !(isAuthLogin && requiresVerification)) {
        window.location.href = '/403';
      }
    } else if (error.response?.status === 404 && !isWishlistEndpoint && !isProductEndpoint) {
      window.location.href = '/404';
    }
    return Promise.reject(error);
  }
);

export { API_URL };
export default api;

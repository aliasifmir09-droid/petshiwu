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
  withCredentials: true
});

// Add Authorization header from localStorage token
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

// Capture token from login/register responses and save to localStorage
api.interceptors.response.use(
  (response) => {
    if (response.data?.token) {
      saveToken(response.data.token);
    }
    return response;
  },
  (error) => {
    const url = error.config?.url || '';

    // ✅ FIX: All endpoints that should NOT trigger a /404 redirect
    const isWishlistEndpoint = url.includes('/wishlist');
    const isProductEndpoint = url.includes('/products/');
    const isCartEndpoint = url.includes('/cart');
    const isDeliveryEndpoint = url.includes('/delivery');
    const isOrderEndpoint = url.includes('/orders/');
    const isSearchEndpoint = url.includes('/search');
    const isRecommendationEndpoint = url.includes('/recommendations');
    const isReorderEndpoint = url.includes('/reorder');
    const isNotificationEndpoint = url.includes('/notifications');
    const isBlogEndpoint = url.includes('/blogs') || url.includes('/care-guides');
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
      if (!isOrderEndpoint && !(isAuthLogin && requiresVerification)) {
        window.location.href = '/403';
      }
    } else if (error.response?.status === 404) {
      // ✅ FIX: Only redirect to /404 for non-optional endpoints
      // Never redirect for cart, delivery, wishlist, products or other optional API calls
      const shouldSkip404Redirect =
        isWishlistEndpoint ||
        isProductEndpoint ||
        isCartEndpoint ||
        isDeliveryEndpoint ||
        isOrderEndpoint ||
        isSearchEndpoint ||
        isRecommendationEndpoint ||
        isReorderEndpoint ||
        isNotificationEndpoint ||
        isBlogEndpoint;

      if (!shouldSkip404Redirect) {
        window.location.href = '/404';
      }
    }

    return Promise.reject(error);
  }
);

export { API_URL };
export default api;

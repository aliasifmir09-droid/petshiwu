import axios from 'axios';

// Use relative URL to leverage Vite proxy in development
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Log API URL in development/debugging (will be removed in production build)
if (typeof window !== 'undefined') {
  console.log('Admin API Base URL:', API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout on 401 (Unauthorized - invalid/expired token)
    // Do NOT logout on 403 (Forbidden - valid token but insufficient permissions)
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { API_URL };
export default api;




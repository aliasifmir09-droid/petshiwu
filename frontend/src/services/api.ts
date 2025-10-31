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
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { API_URL };
export default api;




/**
 * Application configuration constants
 * Centralized location for magic numbers and configuration values
 */

// Tax configuration
export const TAX_RATE = 0.08; // 8% tax rate

// Shipping configuration
export const FREE_SHIPPING_THRESHOLD = 49; // Free shipping for orders over $49
export const STANDARD_SHIPPING_COST = 5.99; // Standard shipping cost

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Cart configuration
export const MAX_CART_ITEMS = 100;
export const MAX_QUANTITY_PER_ITEM = 99;

// Product configuration
export const MAX_PRODUCT_IMAGES = 10;
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 5000;

// Order configuration
export const ORDER_CANCELLATION_WINDOW_HOURS = 24; // Hours after order creation
export const RETURN_WINDOW_DAYS = 30; // Days after delivery

// Review configuration
export const MIN_REVIEW_LENGTH = 10;
export const MAX_REVIEW_LENGTH = 1000;
export const MAX_REVIEW_IMAGES = 5;

// Search configuration
export const MIN_SEARCH_QUERY_LENGTH = 2;
export const MAX_SEARCH_QUERY_LENGTH = 100;
export const SEARCH_AUTOCOMPLETE_LIMIT = 10;

// File upload configuration
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi'];

// Cache configuration
export const CACHE_TTL_PRODUCTS = 300; // 5 minutes
export const CACHE_TTL_PRODUCT = 900; // 15 minutes
export const CACHE_TTL_CATEGORIES = 1800; // 30 minutes

// API configuration
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;

// UI configuration
export const TOAST_DURATION = 3000; // 3 seconds
export const DEBOUNCE_DELAY = 300; // 300ms


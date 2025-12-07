/**
 * Backend application configuration constants
 * Centralized location for magic numbers and configuration values
 */

// Order configuration
export const ORDER_CANCELLATION_WINDOW_HOURS = 24; // Hours after order creation
export const RETURN_WINDOW_DAYS = 30; // Days after delivery

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Cache TTL (in seconds)
export const CACHE_TTL_PRODUCTS = 300; // 5 minutes
export const CACHE_TTL_PRODUCT = 900; // 15 minutes
export const CACHE_TTL_CATEGORIES = 1800; // 30 minutes

// File upload configuration
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi'];

// API configuration
export const API_VERSION = 'v1';
export const API_TIMEOUT = 30000; // 30 seconds

// Stock alert configuration
export const STOCK_ALERT_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

// Email configuration
export const EMAIL_VERIFICATION_EXPIRY_HOURS = 24; // 24 hours
export const PASSWORD_RESET_EXPIRY_HOURS = 0.25; // 15 minutes

// Review configuration
export const MIN_REVIEW_LENGTH = 10;
export const MAX_REVIEW_LENGTH = 1000;
export const MAX_REVIEW_IMAGES = 5;
export const MAX_REVIEW_VIDEOS = 2;

// Search configuration
export const MIN_SEARCH_QUERY_LENGTH = 2;
export const MAX_SEARCH_QUERY_LENGTH = 100;
export const SEARCH_AUTOCOMPLETE_LIMIT = 10;

// CSV Import configuration
export const CSV_BATCH_SIZE = 50;
export const CSV_MAX_ROWS = 10000;


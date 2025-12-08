/**
 * Safe logging utility to prevent data leakage in production
 * Only logs minimal, non-sensitive information
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Safely log errors without exposing sensitive data
 * In production, only logs error type and status code
 * In development, logs full error details for debugging
 */
export const safeError = (message: string, error: any) => {
  if (isDevelopment) {
    console.error(message, error);
    return;
  }

  // Production: Only log safe information
  const safeInfo: any = {
    message: error?.message || 'Unknown error',
    status: error?.response?.status || error?.status || 'N/A',
    url: error?.config?.url ? error.config.url.replace(/\/api\/[^/]+/, '/api/***') : 'N/A'
  };

  // Don't log response data, request data, or stack traces in production
  console.error(message, safeInfo);
};

/**
 * Safely log warnings
 */
export const safeWarn = (message: string, data?: any) => {
  if (isDevelopment) {
    console.warn(message, data);
  } else {
    // Production: Only log the message
    console.warn(message);
  }
};

/**
 * Safely log info (only in development)
 */
export const safeLog = (message: string, data?: any) => {
  if (isDevelopment) {
    console.log(message, data);
  }
  // Production: No logging
};


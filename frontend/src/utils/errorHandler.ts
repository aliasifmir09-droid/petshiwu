/**
 * Utility functions for extracting and formatting error messages from API responses
 * Handles rate limiting, network errors, and other API errors
 */

interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
      error?: string | { message?: string; retryAfter?: number };
      retryAfter?: number;
    };
    statusText?: string;
  };
  request?: any;
  message?: string;
}

/**
 * Extract user-friendly error message from API error
 * Handles rate limiting (429) with retry information
 */
export const extractErrorMessage = (error: ApiError): string => {
  if (!error) {
    return 'An unexpected error occurred';
  }

  // Server responded with error
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Handle rate limiting (429) with specific message and retry time
    if (status === 429) {
      const rateLimitMessage = data?.message || 
                             data?.error?.message || 
                             (typeof data?.error === 'string' ? data.error : null) ||
                             'Too many requests';
      const retryAfter = data?.retryAfter || data?.error?.retryAfter;

      if (retryAfter) {
        const minutes = Math.ceil(retryAfter / 60);
        if (minutes === 1) {
          return `${rateLimitMessage} Please wait 1 minute before trying again.`;
        }
        return `${rateLimitMessage} Please wait ${minutes} minutes before trying again.`;
      }
      return rateLimitMessage || 'Too many requests. Please try again later.';
    }

    // Handle other HTTP errors with actual message from backend
    const errorMessage = data?.message || 
                       (typeof data?.error === 'string' ? data.error : data?.error?.message) ||
                       error.response.statusText || 
                       `Server error: ${status}`;
    
    return errorMessage;
  }

  // Request was made but no response received
  if (error.request) {
    return 'No response from server. Please check your connection.';
  }

  // Error in request setup - use the error message if available
  return error.message || 'An unexpected error occurred';
};

/**
 * Check if error is a rate limit error (429)
 */
export const isRateLimitError = (error: ApiError): boolean => {
  return error.response?.status === 429;
};

/**
 * Get retry after time in seconds from rate limit error
 */
export const getRetryAfter = (error: ApiError): number | null => {
  if (!isRateLimitError(error)) {
    return null;
  }
  
  const data = error.response?.data;
  return data?.retryAfter || data?.error?.retryAfter || null;
};


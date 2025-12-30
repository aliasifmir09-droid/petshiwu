/**
 * Centralized error handling utilities
 * Provides consistent error handling patterns across the application
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

export class AppError extends Error {
  code?: string;
  context?: Record<string, unknown>;
  userMessage?: string;

  constructor(
    message: string,
    code?: string,
    context?: Record<string, unknown>,
    userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.userMessage = userMessage;
  }
}

/**
 * Standard error handler
 * Logs errors consistently and returns user-friendly messages
 */
export const handleError = (
  error: unknown,
  context?: string
): { userMessage: string; logMessage: string } => {
  const timestamp = new Date().toISOString();
  const contextInfo = context ? ` [${context}]` : '';

  // Handle AppError instances
  if (error instanceof AppError) {
    const logMessage = `AppError${contextInfo}: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}${error.context ? ` Context: ${JSON.stringify(error.context)}` : ''}`;
    
    if (import.meta.env.DEV) {
      console.error(logMessage, error);
    }

    return {
      userMessage: error.userMessage || 'An error occurred. Please try again.',
      logMessage,
    };
  }

  // Handle Error instances
  if (error instanceof Error) {
    const logMessage = `Error${contextInfo}: ${error.message}${error.stack ? `\nStack: ${error.stack}` : ''}`;
    
    if (import.meta.env.DEV) {
      console.error(logMessage, error);
    }

    return {
      userMessage: 'An unexpected error occurred. Please try again.',
      logMessage,
    };
  }

  // Handle unknown error types
  const errorString = String(error);
  const logMessage = `Unknown error${contextInfo}: ${errorString}`;
  
  if (import.meta.env.DEV) {
    console.error(logMessage, error);
  }

  return {
    userMessage: 'An unexpected error occurred. Please try again.',
    logMessage,
  };
};

/**
 * Safe error logger
 * Only logs in development mode
 */
export const safeLogError = (error: unknown, context?: string): void => {
  if (import.meta.env.DEV) {
    const { logMessage } = handleError(error, context);
    console.error(logMessage);
  }
};

/**
 * Creates an error info object for tracking
 */
export const createErrorInfo = (
  message: string,
  code?: string,
  context?: Record<string, unknown>
): ErrorInfo => {
  return {
    message,
    code,
    context,
    timestamp: Date.now(),
  };
};

/**
 * Validates and normalizes error responses from API
 */
export const normalizeApiError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Check if it's an API error with response
    const apiError = error as Error & { response?: { data?: { message?: string }; status?: number } };
    if (apiError.response) {
      const message = apiError.response.data?.message || error.message;
      const code = `API_${apiError.response.status || 'UNKNOWN'}`;
      return new AppError(message, code, { status: apiError.response.status }, message);
    }
    return new AppError(error.message, 'UNKNOWN_ERROR', undefined, 'An error occurred. Please try again.');
  }

  return new AppError(
    String(error),
    'UNKNOWN_ERROR',
    undefined,
    'An unexpected error occurred. Please try again.'
  );
};


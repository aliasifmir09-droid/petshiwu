/**
 * Centralized error handling utilities
 * Provides consistent error handling patterns across the application
 */

import { sanitizeErrorMessage, sanitizeErrorObject } from './sanitizeUtils';

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
 * Sanitizes sensitive data before logging
 */
export const handleError = (
  error: unknown,
  context?: string
): { userMessage: string; logMessage: string } => {
  const contextInfo = context ? ` [${context}]` : '';

  // Handle AppError instances
  if (error instanceof AppError) {
    // Sanitize error message and context
    const sanitizedMessage = sanitizeErrorMessage(error.message);
    const sanitizedContext = error.context ? sanitizeErrorObject(error.context) : undefined;
    const logMessage = `AppError${contextInfo}: ${sanitizedMessage}${error.code ? ` (Code: ${error.code})` : ''}${sanitizedContext ? ` Context: ${JSON.stringify(sanitizedContext)}` : ''}`;
    
    // Only log in development mode to prevent sensitive data exposure
    if (import.meta.env.DEV) {
      console.error(logMessage, sanitizedContext || error);
    }

    return {
      userMessage: error.userMessage || 'An error occurred. Please try again.',
      logMessage,
    };
  }

  // Handle Error instances
  if (error instanceof Error) {
    // Sanitize error message and stack trace
    const sanitizedMessage = sanitizeErrorMessage(error.message);
    const sanitizedStack = error.stack ? sanitizeErrorMessage(error.stack) : undefined;
    const logMessage = `Error${contextInfo}: ${sanitizedMessage}${sanitizedStack ? `\nStack: ${sanitizedStack}` : ''}`;
    
    // Only log in development mode
    if (import.meta.env.DEV) {
      console.error(logMessage);
    }

    return {
      userMessage: 'An unexpected error occurred. Please try again.',
      logMessage,
    };
  }

  // Handle unknown error types
  const errorString = String(error);
  const sanitizedError = sanitizeErrorMessage(errorString);
  const logMessage = `Unknown error${contextInfo}: ${sanitizedError}`;
  
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.error(logMessage);
  }

  return {
    userMessage: 'An unexpected error occurred. Please try again.',
    logMessage,
  };
};

/**
 * Safe error logger
 * Only logs in development mode and sanitizes sensitive data
 */
export const safeLogError = (error: unknown, context?: string): void => {
  // Always sanitize before logging, even in dev mode
  const { logMessage } = handleError(error, context);
  
  // Only log in development mode to prevent sensitive data exposure in production
  if (import.meta.env.DEV) {
    console.error(logMessage);
  }
  // In production, consider sending to error tracking service (Sentry, etc.)
  // with sanitized data only
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


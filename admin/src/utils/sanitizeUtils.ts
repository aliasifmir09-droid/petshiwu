/**
 * Sanitization utilities for preventing XSS attacks
 * Provides safe string sanitization for user-generated content
 */

/**
 * Sanitizes a string by removing potentially dangerous HTML/script content
 * React automatically escapes content in JSX, but this provides an extra layer of security
 * and handles edge cases
 */
export const sanitizeString = (input: string | null | undefined): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove any HTML tags and script content
  // This is a basic sanitization - for production, consider using DOMPurify
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick, onerror, etc.)
    .trim();

  // Limit length to prevent DoS
  const MAX_LENGTH = 500;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
};

/**
 * Sanitizes customer name for safe display
 * Combines first and last name with proper sanitization
 */
export const sanitizeCustomerName = (
  firstName?: string | null,
  lastName?: string | null
): string => {
  const first = sanitizeString(firstName || '');
  const last = sanitizeString(lastName || '');
  const fullName = `${first} ${last}`.trim();
  return fullName || 'Guest';
};

/**
 * Sanitizes error message to remove sensitive data
 * Removes potential tokens, passwords, API keys, etc.
 */
export const sanitizeErrorMessage = (message: string): string => {
  if (!message || typeof message !== 'string') {
    return 'An error occurred';
  }

  // Remove common sensitive patterns
  let sanitized = message
    // Remove API keys (common patterns)
    .replace(/[Aa][Pp][Ii][_-]?[Kk][Ee][Yy][\s:=]+['"]?[A-Za-z0-9_-]{20,}['"]?/gi, '[API_KEY]')
    // Remove tokens
    .replace(/[Tt][Oo][Kk][Ee][Nn][\s:=]+['"]?[A-Za-z0-9_-]{20,}['"]?/gi, '[TOKEN]')
    // Remove passwords
    .replace(/[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd][\s:=]+['"]?[^'"]+['"]?/gi, '[PASSWORD]')
    // Remove authorization headers
    .replace(/[Aa]uthorization[\s:=]+['"]?[^'"]+['"]?/gi, '[AUTH_HEADER]')
    // Remove email addresses (optional - may want to keep for debugging)
    // .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    // Remove potential file paths that might expose system info
    .replace(/\/[a-zA-Z0-9\/._-]+/g, '[PATH]')
    .trim();

  // Limit length
  const MAX_LENGTH = 1000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH) + '...';
  }

  return sanitized || 'An error occurred';
};

/**
 * Sanitizes an object to remove sensitive fields before logging
 */
export const sanitizeErrorObject = (error: unknown): Record<string, unknown> => {
  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'authorization',
    'auth',
    'secret',
    'privateKey',
    'private_key',
    'accessToken',
    'refreshToken',
  ];

  if (!error || typeof error !== 'object') {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  const errorObj = error as Record<string, unknown>;

  for (const [key, value] of Object.entries(errorObj)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeErrorMessage(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeErrorObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};


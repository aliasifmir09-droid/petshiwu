/// <reference types="node" />

/**
 * Sanitize sensitive data from logs
 */
export const sanitizeForLogging = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item));
  }
  
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'apiSecret',
    'api_secret',
    'jwt',
    'jwtSecret',
    'jwt_secret',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'privateKey',
    'private_key',
    'creditCard',
    'credit_card',
    'cvv',
    'cvc',
    'ssn',
    'socialSecurityNumber',
    'authorization',
    'cookie'
  ];
  
  const sanitized: any = {};
  
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const lowerKey = key.toLowerCase();
      
      // Replace sensitive fields with [REDACTED]
      if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForLogging(data[key]);
    }
  }
  
  return sanitized;
};

/**
 * Safe console.log that sanitizes sensitive data
 */
export const safeLog = (message: string, data?: any) => {
  if (data) {
    console.log(message, sanitizeForLogging(data));
  } else {
    console.log(message);
  }
};

/**
 * Safe console.error that sanitizes sensitive data
 */
export const safeError = (message: string, error?: any) => {
  if (error) {
    const sanitizedError = {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      ...sanitizeForLogging(error)
    };
    console.error(message, sanitizedError);
  } else {
    console.error(message);
  }
};


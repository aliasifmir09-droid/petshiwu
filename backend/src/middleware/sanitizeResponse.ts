/// <reference types="node" />
import { Request, Response, NextFunction } from 'express';

/**
 * Sanitize response data to prevent data leakage
 * Removes sensitive fields from API responses
 * 
 * Note: Authentication endpoints (login/register) are allowed to return tokens
 */
export const sanitizeResponse = (req: Request, res: Response, next: NextFunction) => {
  // Can be disabled via environment variable if needed
  if (process.env.DISABLE_RESPONSE_SANITIZATION === 'true') {
    return next();
  }
  
  // Check if this is an authentication endpoint that needs to return tokens
  const isAuthEndpoint = req.path.includes('/auth/login') || 
                         req.path.includes('/auth/register') ||
                         req.path.includes('/auth/updatepassword');
  
  const originalJson = res.json;
  
  // Prevent double-wrapping
  if ((res.json as any).__sanitized) {
    return next();
  }
  
  res.json = function (data: any) {
    try {
      if (data && typeof data === 'object') {
        // For auth endpoints, allow token field but still sanitize other sensitive data
        data = sanitizeObject(data, new WeakSet(), 0, isAuthEndpoint);
      }
    } catch (error) {
      // If sanitization fails, log and return original data (don't crash)
      if (process.env.NODE_ENV === 'development') {
        console.error('Response sanitization error:', error);
      }
    }
    return originalJson.call(this, data);
  };
  
  // Mark as wrapped to prevent double-wrapping
  (res.json as any).__sanitized = true;
  
  next();
};

/**
 * Recursively sanitize object to prevent data leakage
 * Includes depth limit and circular reference protection
 * @param allowToken - If true, allows 'token' field (for auth endpoints)
 */
function sanitizeObject(obj: any, visited = new WeakSet(), depth = 0, allowToken = false): any {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[Max Depth Reached]';
  }
  
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle circular references
  if (visited.has(obj)) {
    return '[Circular Reference]';
  }
  
  // Mark as visited
  visited.add(obj);
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, visited, depth + 1, allowToken));
  }
  
  // Handle Date, RegExp, and other special objects
  if (obj instanceof Date || obj instanceof RegExp) {
    return obj;
  }
  
  // Handle Mongoose documents (they have circular references)
  if (obj.constructor && obj.constructor.name === 'model') {
    // Convert Mongoose document to plain object
    try {
      obj = obj.toObject ? obj.toObject() : obj;
    } catch (e) {
      return '[Object]';
    }
  }
  
  const sensitiveFields = [
    'password',
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
    'socialSecurityNumber'
  ];
  
  // Add 'token' to sensitive fields only if not allowed
  const fieldsToSanitize = allowToken 
    ? sensitiveFields 
    : [...sensitiveFields, 'token'];
  
  const sanitized: any = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase();
      
      // Skip sensitive fields
      if (fieldsToSanitize.some(field => lowerKey.includes(field.toLowerCase()))) {
        continue;
      }
      
      // Skip Mongoose internal properties
      if (key.startsWith('_') || key === '__v' || key === '$__' || key === 'isNew') {
        continue;
      }
      
      // Recursively sanitize nested objects
      try {
        sanitized[key] = sanitizeObject(obj[key], visited, depth + 1, allowToken);
      } catch (e) {
        // If recursion fails, skip this property
        continue;
      }
    }
  }
  
  return sanitized;
}


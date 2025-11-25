/// <reference types="node" />
import { Request, Response, NextFunction } from 'express';

/**
 * Sanitize response data to prevent data leakage
 * Removes sensitive fields from API responses
 */
export const sanitizeResponse = (req: Request, res: Response, next: NextFunction) => {
  // Only sanitize in production or when explicitly enabled
  if (process.env.NODE_ENV !== 'production' && !process.env.ENABLE_RESPONSE_SANITIZATION) {
    return next();
  }
  
  const originalJson = res.json;
  
  // Prevent double-wrapping
  if ((res.json as any).__sanitized) {
    return next();
  }
  
  res.json = function (data: any) {
    try {
      if (data && typeof data === 'object') {
        data = sanitizeObject(data);
      }
    } catch (error) {
      // If sanitization fails, log and return original data
      console.error('Response sanitization error:', error);
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
 */
function sanitizeObject(obj: any, visited = new WeakSet(), depth = 0): any {
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
    return obj.map(item => sanitizeObject(item, visited, depth + 1));
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
    'socialSecurityNumber'
  ];
  
  const sanitized: any = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase();
      
      // Skip sensitive fields
      if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
        continue;
      }
      
      // Skip Mongoose internal properties
      if (key.startsWith('_') || key === '__v' || key === '$__' || key === 'isNew') {
        continue;
      }
      
      // Recursively sanitize nested objects
      try {
        sanitized[key] = sanitizeObject(obj[key], visited, depth + 1);
      } catch (e) {
        // If recursion fails, skip this property
        continue;
      }
    }
  }
  
  return sanitized;
}


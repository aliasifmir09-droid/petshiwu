/// <reference types="node" />
import { Request, Response, NextFunction } from 'express';

/**
 * Sanitize response data to prevent data leakage
 * Removes sensitive fields from API responses
 */
export const sanitizeResponse = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function (data: any) {
    if (data && typeof data === 'object') {
      data = sanitizeObject(data);
    }
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Recursively sanitize object to remove sensitive fields
 */
function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
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
      
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  
  return sanitized;
}


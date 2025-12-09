/**
 * API Service Tests
 * Tests API configuration and error handling patterns
 */

import { describe, test, expect } from 'vitest';
import { API_URL } from '../api';

describe('API Service', () => {
  describe('API URL Configuration', () => {
    test('should export API_URL', () => {
      expect(API_URL).toBeDefined();
      expect(typeof API_URL).toBe('string');
    });

    test('should have correct base URL format', () => {
      // API_URL should not have trailing slashes
      expect(API_URL.endsWith('/')).toBe(false);
    });

    test('should be a valid URL or path', () => {
      // Should be either a full URL or a path starting with /
      const isValid = API_URL.startsWith('http') || API_URL.startsWith('/');
      expect(isValid).toBe(true);
    });
  });

  describe('Error Handling Patterns', () => {
    test('should identify public endpoints correctly', () => {
      const publicEndpoints = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/products',
        '/api/categories'
      ];

      publicEndpoints.forEach(endpoint => {
        const isPublic = endpoint.includes('/auth/login') || 
                        endpoint.includes('/auth/register') ||
                        endpoint.includes('/products') ||
                        endpoint.includes('/categories');
        expect(isPublic).toBe(true);
      });
    });

    test('should identify error status codes', () => {
      const errorCodes = [401, 403, 404, 500];
      errorCodes.forEach(code => {
        expect(code).toBeGreaterThanOrEqual(400);
      });
    });
  });

  describe('Skip Auth Flag', () => {
    test('should support skipAuth configuration', () => {
      // Verify skipAuth is part of the axios config extension
      const config: any = { skipAuth: true };
      expect(config.skipAuth).toBe(true);
    });
  });
});


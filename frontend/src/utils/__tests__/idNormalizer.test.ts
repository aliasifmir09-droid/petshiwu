/**
 * ID Normalizer Utility Tests
 * Tests ID normalization functions
 */

import { describe, test, expect } from 'vitest';
import { normalizeId } from '../idNormalizer';

describe('ID Normalizer Utility', () => {
  describe('normalizeId', () => {
    test('should convert valid MongoDB ObjectId string', () => {
      const validObjectId = '507f1f77bcf86cd799439011';
      const result = normalizeId(validObjectId);
      expect(result).toBe(validObjectId);
      expect(typeof result).toBe('string');
    });

    test('should return string even if not valid ObjectId format', () => {
      // The function returns the string anyway, backend validates
      const result = normalizeId('123');
      expect(result).toBe('123');
      expect(typeof result).toBe('string');
    });

    test('should return null for numbers', () => {
      // Numbers are not handled, returns null
      const result = normalizeId(123);
      expect(result).toBeNull();
    });

    test('should handle ObjectId-like objects with toString', () => {
      const mockObjectId = { toString: () => '507f1f77bcf86cd799439011' };
      const result = normalizeId(mockObjectId as any);
      expect(result).toBe('507f1f77bcf86cd799439011');
    });

    test('should handle objects with _id property', () => {
      const objWithId = { _id: '507f1f77bcf86cd799439011' };
      const result = normalizeId(objWithId);
      expect(result).toBe('507f1f77bcf86cd799439011');
    });

    test('should return null for null/undefined', () => {
      expect(normalizeId(null)).toBeNull();
      expect(normalizeId(undefined)).toBeNull();
    });

    test('should return null for empty string', () => {
      // Empty string is falsy, returns null
      const result = normalizeId('');
      expect(result).toBeNull();
    });

    test('should handle arrays of IDs', () => {
      const ids = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];
      const normalized = ids.map(id => normalizeId(id));
      
      expect(normalized).toEqual(['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']);
      normalized.forEach(id => {
        expect(typeof id).toBe('string');
      });
    });
  });
});


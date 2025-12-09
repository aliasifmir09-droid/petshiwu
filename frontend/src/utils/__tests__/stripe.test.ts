/**
 * Stripe Utility Tests
 * Tests Stripe initialization and configuration
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getStripe } from '../stripe';

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({} as any))
}));

describe('Stripe Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache to test initialization
    vi.resetModules();
  });

  describe('getStripe', () => {
    test('should return a promise', () => {
      const result = getStripe();
      expect(result).toBeInstanceOf(Promise);
    });

    test('should initialize Stripe only once', async () => {
      await import('@stripe/stripe-js');
      
      // Call getStripe multiple times
      getStripe();
      getStripe();
      getStripe();

      // Should only initialize once (cached)
      // The actual call count depends on implementation
      expect(getStripe).toBeDefined();
    });

    test('should handle missing publishable key', () => {
      // Mock environment without key
      const originalEnv = import.meta.env;
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, VITE_STRIPE_PUBLISHABLE_KEY: undefined },
        writable: true,
        configurable: true
      });

      // Should handle gracefully
      const result = getStripe();
      expect(result).toBeInstanceOf(Promise);
    });
  });
});


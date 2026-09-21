import { describe, expect, test } from 'vitest';
import { normalizeCheckoutPhone } from '@/utils/checkoutPhone';

describe('normalizeCheckoutPhone', () => {
  test('accepts formatted US numbers', () => {
    expect(normalizeCheckoutPhone('(347) 555-0100')).toBe('+13475550100');
    expect(normalizeCheckoutPhone('347-555-0100')).toBe('+13475550100');
    expect(normalizeCheckoutPhone('13475550100')).toBe('+13475550100');
    expect(normalizeCheckoutPhone('+1 (347) 555-0100')).toBe('+13475550100');
  });

  test('leaves empty input empty', () => {
    expect(normalizeCheckoutPhone('')).toBe('');
    expect(normalizeCheckoutPhone(undefined)).toBe('');
  });
});

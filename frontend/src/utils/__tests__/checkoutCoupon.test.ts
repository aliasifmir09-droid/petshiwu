import { describe, expect, test } from 'vitest';
import { checkoutCodeFromError, checkoutCodeFromResponse } from '../checkoutCoupon';

describe('checkoutCodeFromResponse', () => {
  test('treats a free-delivery code with $0 item discount as applied', () => {
    const applied = checkoutCodeFromResponse('testcode', {
      valid: true,
      code: 'testcode',
      discountAmount: 0,
      freeShipping: true,
      message: '✓ Delivery fee waived — $0 shipping (saving $6.00)',
    });

    expect(applied).toEqual({
      ok: true,
      code: 'TESTCODE',
      discountAmount: 0,
      waivesShipping: true,
      message: '✓ Delivery fee waived — $0 shipping (saving $6.00)',
    });
  });

  test('keeps a percent discount and does not waive shipping', () => {
    const applied = checkoutCodeFromResponse('freedom20', {
      valid: true,
      code: 'FREEDOM20',
      discountAmount: 8,
      freeShipping: false,
      message: '✓ 20% off first order (max $10, no autoship) — saving $8.00',
    });

    expect(applied.ok).toBe(true);
    expect(applied.discountAmount).toBe(8);
    expect(applied.waivesShipping).toBe(false);
  });

  test('surfaces the API message when a code is not valid', () => {
    const applied = checkoutCodeFromResponse('NOPE', {
      valid: false,
      message: 'Invalid coupon code. Please check and try again.',
    });

    expect(applied.ok).toBe(false);
    expect(applied.waivesShipping).toBe(false);
    expect(applied.message).toMatch(/invalid coupon code/i);
  });
});

describe('checkoutCodeFromError', () => {
  test('uses the API error body when present', () => {
    expect(
      checkoutCodeFromError({ response: { data: { message: 'Please enter a coupon code.' } } })
    ).toBe('Please enter a coupon code.');
  });

  test('falls back when the request never returns JSON', () => {
    expect(checkoutCodeFromError(new TypeError('Failed to fetch'))).toBe(
      'Could not apply coupon. Please try again.'
    );
  });
});

import { describe, expect, test } from 'vitest';
import { amountUntilFreeShipping, shippingCostForSubtotal } from '../orderTotals';

describe('orderTotals', () => {
  test('charges $7 below $49 and free shipping at exactly $49', () => {
    expect(shippingCostForSubtotal(48.99)).toBe(7);
    expect(shippingCostForSubtotal(49)).toBe(0);
    expect(shippingCostForSubtotal(49.01)).toBe(0);
  });

  test('a private free-shipping coupon zeros delivery below $49', () => {
    expect(shippingCostForSubtotal(19.99, true)).toBe(0);
    expect(shippingCostForSubtotal(48.99, true)).toBe(0);
  });

  test('orders at $49 and over ship free, including TopDawg', () => {
    expect(shippingCostForSubtotal(80, false, true)).toBe(0);
    expect(shippingCostForSubtotal(10, true, true)).toBe(0);
    expect(shippingCostForSubtotal(10, false, true)).toBe(7);
  });

  test('shows remaining dollars until free shipping, including $49 even', () => {
    expect(amountUntilFreeShipping(40)).toBe(9);
    expect(amountUntilFreeShipping(49)).toBe(0);
    expect(amountUntilFreeShipping(60)).toBe(0);
  });
});

import { describe, expect, test } from 'vitest';
import { amountUntilFreeShipping, shippingCostForSubtotal } from '../orderTotals';

describe('orderTotals', () => {
  test('charges $6 below $49 and free shipping at exactly $49', () => {
    expect(shippingCostForSubtotal(48.99)).toBe(6);
    expect(shippingCostForSubtotal(49)).toBe(0);
    expect(shippingCostForSubtotal(49.01)).toBe(0);
  });

  test('shows remaining dollars until free shipping, including $49 even', () => {
    expect(amountUntilFreeShipping(40)).toBe(9);
    expect(amountUntilFreeShipping(49)).toBe(0);
    expect(amountUntilFreeShipping(60)).toBe(0);
  });
});

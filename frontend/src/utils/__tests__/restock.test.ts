import { beforeEach, describe, expect, test } from 'vitest';
import {
  RESTOCK_COUPON,
  RESTOCK_DISCOUNT_COPY,
  clearRestockCoupon,
  readRestockCoupon,
  rememberRestockCoupon,
} from '../restock';

describe('restock coupon helpers', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('Ask first uses RESTOCK7 at 7% off max $10', () => {
    expect(RESTOCK_COUPON).toBe('RESTOCK7');
    expect(RESTOCK_DISCOUNT_COPY).toMatch(/7%/);
    expect(RESTOCK_DISCOUNT_COPY).toMatch(/\$10/);
  });

  test('stores and clears the restock coupon for checkout', () => {
    expect(readRestockCoupon()).toBe('');
    rememberRestockCoupon();
    expect(sessionStorage.getItem('petshiwu_restock_coupon')).toBe('RESTOCK7');
    expect(readRestockCoupon()).toBe('RESTOCK7');
    clearRestockCoupon();
    expect(readRestockCoupon()).toBe('');
  });
});

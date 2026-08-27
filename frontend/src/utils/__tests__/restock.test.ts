import { beforeEach, describe, expect, test } from 'vitest';
import {
  ASK_COUPON,
  ASK_DISCOUNT_COPY,
  AUTOSHIP_COUPON,
  AUTOSHIP_DISCOUNT_COPY,
  clearRestockCoupon,
  isRestockConsumable,
  readRestockCoupon,
  rememberRestockCoupon,
} from '../restock';

describe('restock coupon helpers', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('Ask first / reorder is RESTOCK5 at 5% off max $10', () => {
    expect(ASK_COUPON).toBe('RESTOCK5');
    expect(ASK_DISCOUNT_COPY).toMatch(/5%/);
    expect(ASK_DISCOUNT_COPY).toMatch(/\$10/);
  });

  test('Autoship is RESTOCK7 at 7% off max $10', () => {
    expect(AUTOSHIP_COUPON).toBe('RESTOCK7');
    expect(AUTOSHIP_DISCOUNT_COPY).toMatch(/7%/);
  });

  test('stores and clears restock coupons for checkout', () => {
    expect(readRestockCoupon()).toBe('');
    rememberRestockCoupon(ASK_COUPON);
    expect(sessionStorage.getItem('petshiwu_restock_coupon')).toBe('RESTOCK5');
    expect(readRestockCoupon()).toBe('RESTOCK5');
    rememberRestockCoupon(AUTOSHIP_COUPON);
    expect(readRestockCoupon()).toBe('RESTOCK7');
    clearRestockCoupon();
    expect(readRestockCoupon()).toBe('');
  });

  test('food and treats restock, toys do not', () => {
    expect(isRestockConsumable("McLovin's Salmon Meal Topper")).toBe(true);
    expect(isRestockConsumable('Kong Classic Dog Toy')).toBe(false);
    expect(isRestockConsumable('Halloween costume')).toBe(false);
  });
});

import { beforeEach, describe, expect, test } from 'vitest';
import {
  ASK_COUPON,
  ASK_DISCOUNT_COPY,
  AUTOSHIP_COUPON,
  AUTOSHIP_DISCOUNT_COPY,
  DEFAULT_INTERVAL_DAYS,
  RESTOCK_CADENCE,
  cadenceLabel,
  clearRestockCoupon,
  defaultRemindParts,
  isRestockConsumable,
  isValidIntervalDays,
  readRestockCoupon,
  rememberRestockCoupon,
  rememberRestockPay,
  remindAtIso,
  readRestockPay,
  RESTOCK_PAY_OPTIONS,
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

  test('cadence includes every day and every week, not a locked 4 weeks', () => {
    expect(DEFAULT_INTERVAL_DAYS).toBe(7);
    expect(isValidIntervalDays(1)).toBe(true);
    expect(isValidIntervalDays(7)).toBe(true);
    expect(RESTOCK_CADENCE.map((row) => row.intervalDays)).toEqual([1, 7, 14, 21, 28, 35, 42, 56]);
    expect(cadenceLabel(7)).toBe('Every week');
    const parts = defaultRemindParts(7, new Date('2026-08-27T15:00:00'));
    expect(parts.time).toBe('09:00');
    const iso = remindAtIso('2026-09-03', '09:30');
    expect(new Date(iso).getHours()).toBeDefined();
    expect(Number.isNaN(new Date(iso).getTime())).toBe(false);
  });

  test('remembers Apple Pay, Google Pay, PayPal, or card for checkout', () => {
    expect(RESTOCK_PAY_OPTIONS.map((row) => row.id)).toEqual([
      'apple_pay',
      'google_pay',
      'paypal',
      'credit_card',
    ]);
    rememberRestockPay('apple_pay');
    expect(readRestockPay()).toBe('apple_pay');
  });
});

import { describe, expect, test } from 'vitest';
import { ORDERS_OPEN_AT, ORDERS_OPEN_LABEL, areOrdersOpen } from '@/config/launch';

describe('order launch date', () => {
  test('orders opened when PayPal went production live', () => {
    expect(ORDERS_OPEN_LABEL).toBe('now');
    expect(ORDERS_OPEN_AT.toISOString()).toBe('2026-08-20T16:00:00.000Z');
  });

  test('is open the day PayPal went live (Aug 20)', () => {
    expect(areOrdersOpen(new Date('2026-08-20T12:00:00-04:00'))).toBe(true);
  });

  test('is open for any time after go-live', () => {
    expect(areOrdersOpen(new Date())).toBe(true);
  });
});

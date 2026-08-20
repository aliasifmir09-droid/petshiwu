import { describe, expect, test } from 'vitest';
import { ORDERS_OPEN_AT, ORDERS_OPEN_LABEL, areOrdersOpen } from '@/config/launch';

describe('order launch date', () => {
  test('is August 28, 2026 Eastern Time', () => {
    expect(ORDERS_OPEN_LABEL).toBe('August 28, 2026');
    expect(ORDERS_OPEN_AT.toISOString()).toBe('2026-08-28T04:00:00.000Z');
  });

  test('is closed the day before launch', () => {
    expect(areOrdersOpen(new Date('2026-08-27T23:59:00-04:00'))).toBe(false);
  });

  test('is open at midnight Eastern on launch day', () => {
    expect(areOrdersOpen(new Date('2026-08-28T00:00:00-04:00'))).toBe(true);
  });
});

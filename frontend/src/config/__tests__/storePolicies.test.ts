import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import {
  CANCELLATION_STATEMENT,
  DELIVERY_STATEMENT,
  ORDER_CANCEL_WINDOW_HOURS,
  RETURN_FOOD_STATEMENT,
  RETURN_WINDOW_DAYS,
} from '@/config/storePolicies';
import { TONIGHT } from '@/data/tonightDelivery';
import { ORDER_CANCELLATION_WINDOW_HOURS, RETURN_WINDOW_DAYS as CONST_RETURN_DAYS } from '@/config/constants';

describe('one storefront policy', () => {
  test('frontend constants agree', () => {
    expect(RETURN_WINDOW_DAYS).toBe(365);
    expect(CONST_RETURN_DAYS).toBe(365);
    expect(ORDER_CANCEL_WINDOW_HOURS).toBe(2);
    expect(ORDER_CANCELLATION_WINDOW_HOURS).toBe(2);
    expect(TONIGHT.weekdayCutoff).toBe('3 PM');
    expect(TONIGHT.weekendCutoff).toBe('1 PM');
    expect(TONIGHT.timezone).toBe('ET');
  });

  test('shipping page has one cutoff matrix and no stale launch copy', () => {
    const src = readFileSync(path.join(__dirname, '../../pages/ShippingPolicy.tsx'), 'utf8');
    expect(src).toContain('DELIVERY_STATEMENT');
    expect(src).not.toMatch(/2 PM/);
    expect(src).not.toMatch(/August 28/);
    expect(src).not.toMatch(/guaranteed to arrive/);
  });

  test('policy statements name 365-day returns and 2-hour cancel', () => {
    expect(CANCELLATION_STATEMENT).toMatch(/2 hours/);
    expect(RETURN_FOOD_STATEMENT).toMatch(/Unopened food/);
    expect(DELIVERY_STATEMENT).toMatch(/3 PM ET weekdays/);
    expect(DELIVERY_STATEMENT).toMatch(/1 PM ET weekends/);
  });
});

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import {
  FIRST_ORDER_CARD_LINE,
  FIRST_ORDER_CODE,
  FIRST_ORDER_COPY,
  REPEAT_ORDER_CARD_LINE,
  REPEAT_ORDER_CODE,
  REPEAT_ORDER_COPY,
} from '../publicPromos';

const dir = dirname(fileURLToPath(import.meta.url));

describe('public storefront promos', () => {
  test('first order stays FREEDOM20 at 20% off, max $10', () => {
    expect(FIRST_ORDER_CODE).toBe('FREEDOM20');
    expect(FIRST_ORDER_COPY).toBe('20% off, max $10');
    expect(FIRST_ORDER_CARD_LINE).toMatch(/20% off, max \$10/);
  });

  test('repeat order is 10% off, max $10, with no autoship', () => {
    expect(REPEAT_ORDER_CODE).toBe('RESTOCK5');
    expect(REPEAT_ORDER_COPY).toBe('10% off, max $10');
    expect(REPEAT_ORDER_CARD_LINE).toMatch(/10% off, max \$10/);
    expect(REPEAT_ORDER_CARD_LINE).toMatch(/no autoship/i);
  });

  test('checkout only lists those two public codes', () => {
    const checkout = readFileSync(join(dir, '../../pages/Checkout.tsx'), 'utf8');
    expect(checkout).toContain('FIRST_ORDER_CODE');
    expect(checkout).toContain('REPEAT_ORDER_CODE');
    expect(checkout).not.toMatch(/AUTOSHIP_COUPON/);
    expect(checkout).not.toMatch(/AUTOSHIP_DISCOUNT_COPY/);
  });
});

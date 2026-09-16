import { describe, expect, test } from 'vitest';
import { CATALOG_PRODUCT_COUNT_LABEL } from '@/config/catalog';
import { inStockLabel, ORDERING_PAUSED, ORDERING_PAUSED_HEADLINE } from '@/config/ordering';

describe('storefront hold and catalog copy', () => {
  test('orders stay paused until we flip the flag', () => {
    expect(ORDERING_PAUSED).toBe(true);
    expect(ORDERING_PAUSED_HEADLINE).toMatch(/start accepting orders soon/i);
  });

  test('does not advertise a 10,000+ catalog', () => {
    expect(CATALOG_PRODUCT_COUNT_LABEL).toBe('4,000+');
    expect(CATALOG_PRODUCT_COUNT_LABEL).not.toMatch(/10,000/);
  });

  test('paused inventory badge says in stock, not ready to ship', () => {
    expect(inStockLabel(true)).toBe('In stock');
    expect(inStockLabel(false)).toBe('Out of stock');
  });
});

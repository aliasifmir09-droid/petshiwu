import { describe, expect, test } from 'vitest';
import { CATALOG_PRODUCT_COUNT_LABEL } from '@/config/catalog';
import { addToCartLabel, inStockLabel, ORDERING_PAUSED, ORDERING_PAUSED_HEADLINE } from '@/config/ordering';

describe('storefront hold and catalog copy', () => {
  test('orders stay paused until we flip the flag', () => {
    expect(ORDERING_PAUSED).toBe(true);
    expect(ORDERING_PAUSED_HEADLINE).toMatch(/start accepting orders soon/i);
  });

  test('does not advertise a 10,000+ catalog', () => {
    expect(CATALOG_PRODUCT_COUNT_LABEL).toBe('4,000+');
    expect(CATALOG_PRODUCT_COUNT_LABEL).not.toMatch(/10,000/);
  });

  test('paused inventory badge is catalog availability, not live stock', () => {
    expect(inStockLabel(true)).toBe('In catalog');
    expect(inStockLabel(false)).toBe('Out of stock');
    expect(addToCartLabel(true)).toBe('Save for checkout');
    expect(addToCartLabel(false)).toBe('Out of stock');
  });
});

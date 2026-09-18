import { describe, expect, test } from 'vitest';
import { CATALOG_PRODUCT_COUNT_LABEL } from '@/config/catalog';
import { addToCartLabel, inStockLabel, ORDERING_PAUSED } from '@/config/ordering';

describe('storefront hold and catalog copy', () => {
  test('checkout is open for payment', () => {
    expect(ORDERING_PAUSED).toBe(false);
  });

  test('does not advertise a 10,000+ catalog', () => {
    expect(CATALOG_PRODUCT_COUNT_LABEL).toBe('4,000+');
    expect(CATALOG_PRODUCT_COUNT_LABEL).not.toMatch(/10,000/);
  });

  test('live inventory badge is ready to ship', () => {
    expect(inStockLabel(true)).toBe('Ready to ship');
    expect(inStockLabel(false)).toBe('Out of stock');
    expect(addToCartLabel(true)).toBe('Add to cart');
    expect(addToCartLabel(false)).toBe('Out of stock');
  });
});

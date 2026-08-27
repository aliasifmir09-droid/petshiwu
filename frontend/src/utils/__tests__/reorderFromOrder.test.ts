import { describe, expect, test } from 'vitest';
import { orderItemProductId, pickInStockVariant } from '../reorderFromOrder';

describe('orderItemProductId', () => {
  test('reads string, object, and nested ids', () => {
    expect(orderItemProductId({ product: 'abc123' })).toBe('abc123');
    expect(orderItemProductId({ product: { _id: 'def456' } })).toBe('def456');
    expect(orderItemProductId({})).toBe('');
  });
});

describe('pickInStockVariant', () => {
  const product = {
    _id: '1',
    name: 'Dry food',
    slug: 'dry-food',
    basePrice: 20,
    totalStock: 4,
    variants: [
      { sku: 'small', stock: 0, price: 10 },
      { sku: 'large', stock: 3, price: 20 },
    ],
  } as any;

  test('prefers the ordered SKU when it still has stock', () => {
    expect(pickInStockVariant(product, 'large')?.sku).toBe('large');
  });

  test('falls back to any in-stock variant', () => {
    expect(pickInStockVariant(product, 'small')?.sku).toBe('large');
  });

  test('treats catalog inStock as addable when variant stock is missing or zero', () => {
    const listing = {
      _id: '2',
      name: "McLovin's Salmon freeze-dried topper",
      slug: 'mclovin-salmon',
      basePrice: 18,
      totalStock: 0,
      inStock: true,
      variants: [{ sku: 'bag', stock: 0, price: 18 }],
    } as any;
    expect(pickInStockVariant(listing, 'bag')?.sku).toBe('bag');
    expect(pickInStockVariant(listing, 'bag')?.stock).toBeGreaterThan(0);

    const omitted = {
      ...listing,
      variants: [{ sku: 'bag', price: 18 }],
    } as any;
    delete omitted.variants[0].stock;
    expect(pickInStockVariant(omitted, 'bag')?.sku).toBe('bag');
  });
});

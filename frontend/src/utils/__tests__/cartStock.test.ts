import { describe, expect, test } from 'vitest';
import { availableCartStock } from '../cartStock';
import { Product, ProductVariant } from '@/types';

const product = (overrides: Partial<Product> = {}): Product => ({
  _id: '507f1f77bcf86cd799439011',
  name: 'Hill\'s c/d',
  slug: 'hills-cd',
  description: 'desc',
  brand: "Hill's",
  category: 'food',
  images: ['https://example.com/a.jpg'],
  variants: [],
  basePrice: 20,
  averageRating: 0,
  totalReviews: 0,
  petType: 'cat',
  tags: [],
  features: [],
  isActive: true,
  isFeatured: false,
  inStock: true,
  totalStock: 12,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const variant = (overrides: Partial<ProductVariant> = {}): ProductVariant => ({
  price: 20,
  stock: 5,
  sku: 'small',
  ...overrides,
});

describe('availableCartStock', () => {
  test('uses explicit variant stock including zero', () => {
    expect(availableCartStock(product(), variant({ stock: 8 }))).toBe(8);
    expect(availableCartStock(product({ inStock: true, totalStock: 40 }), variant({ stock: 0 }))).toBe(0);
  });

  test('falls back to product stock when the listing variant omits stock', () => {
    const listing = variant();
    delete (listing as { stock?: number }).stock;
    expect(availableCartStock(product({ totalStock: 12, inStock: true }), listing)).toBe(12);
    expect(availableCartStock(product({ totalStock: 12, inStock: true }), undefined)).toBe(12);
  });

  test('treats in-stock products without a stock count as addable', () => {
    expect(availableCartStock(product({ totalStock: undefined as unknown as number, inStock: true }))).toBe(1);
    expect(availableCartStock(product({ totalStock: 0, inStock: true }))).toBe(1);
    expect(availableCartStock(product({ totalStock: 0, inStock: false }))).toBe(0);
  });
});

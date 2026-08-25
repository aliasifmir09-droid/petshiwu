import { describe, expect, test } from 'vitest';
import {
  canonicalPetTypeSlug,
  catalogPetType,
  getListingPrice,
  getListingVariant,
  getValidCompareAtPrice,
} from '../productPrice';
import { Product, ProductVariant } from '@/types';

const variant = (price: number, sku: string): ProductVariant => ({
  price,
  stock: 10,
  sku,
});

const product = (overrides: Partial<Product> = {}): Product => ({
  _id: '1',
  name: 'Hill\'s c/d',
  slug: 'hills-cd',
  description: 'desc',
  brand: "Hill's",
  category: 'food',
  images: ['https://example.com/a.jpg'],
  variants: [variant(36.75, 'small'), variant(67.99, 'medium'), variant(108.41, 'large')],
  basePrice: 67.99,
  averageRating: 0,
  totalReviews: 0,
  petType: 'cat',
  tags: [],
  features: [],
  isActive: true,
  isFeatured: false,
  inStock: true,
  totalStock: 90,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('productPrice', () => {
  test('listing variant matches displayed basePrice, not variants[0]', () => {
    const p = product();
    expect(getListingVariant(p)?.sku).toBe('medium');
    expect(getListingPrice(p)).toBe(67.99);
  });

  test('falls back to first variant when basePrice is not a size', () => {
    const p = product({ basePrice: 9.99 });
    expect(getListingVariant(p)?.sku).toBe('small');
    expect(getListingPrice(p)).toBe(36.75);
  });

  test('hides compare-at that is not higher than the selling price', () => {
    expect(getValidCompareAtPrice(74.99, 16.58)).toBeUndefined();
    expect(getValidCompareAtPrice(41.38, 41.99)).toBe(41.99);
    expect(getValidCompareAtPrice(20, 0)).toBeUndefined();
  });

  test('canonicalizes small pet types for URLs', () => {
    expect(canonicalPetTypeSlug('small pet')).toBe('small-animal');
    expect(canonicalPetTypeSlug('small-pet')).toBe('small-animal');
    expect(canonicalPetTypeSlug('Dog')).toBe('dog');
  });

  test('maps /small-animal shop URLs back to catalog small-pet', () => {
    expect(catalogPetType('small-animal')).toBe('small-pet');
    expect(catalogPetType('small pet')).toBe('small-pet');
  });
});

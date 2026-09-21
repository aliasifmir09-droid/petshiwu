import { describe, expect, test } from 'vitest';
import { cartLineKey, cartLinePrice, cartLineQuantity, cartSnapshotsEqual, cloneCartItems } from '../cartItems';
import { CartItem, Product } from '@/types';

const product = (id: string, price: number): Product => ({
  _id: id,
  name: 'Merrick',
  slug: 'merrick',
  description: 'desc',
  brand: 'Merrick',
  category: 'food',
  images: [],
  variants: [{ price, sku: '12lb', stock: 8 }],
  basePrice: price,
  averageRating: 0,
  totalReviews: 0,
  petType: 'dog',
  tags: [],
  features: [],
  isActive: true,
  isFeatured: false,
  inStock: true,
  totalStock: 8,
  createdAt: '',
  updatedAt: '',
});

const line = (quantity: number, price = 52.99): CartItem => ({
  product: product('507f1f77bcf86cd799439011', price),
  variant: { price, sku: '12lb', stock: 8 },
  quantity,
});

describe('cartSnapshotsEqual', () => {
  test('treats the same id, sku, quantity, and price as unchanged', () => {
    expect(cartSnapshotsEqual([line(2)], [line(2)])).toBe(true);
  });

  test('detects the qty 1 vs qty 2 checkout flash', () => {
    expect(cartSnapshotsEqual([line(1)], [line(2)])).toBe(false);
  });

  test('cloneCartItems copies quantity so later mutations cannot leak', () => {
    const original = line(1);
    const cloned = cloneCartItems([original]);
    cloned[0].quantity = 2;
    expect(original.quantity).toBe(1);
    expect(cartLineQuantity(cloned[0])).toBe(2);
    expect(cartLineKey(cloned[0])).toBe('507f1f77bcf86cd799439011::12lb');
    expect(cartLinePrice(cloned[0])).toBe(52.99);
  });
});

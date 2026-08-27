import { describe, expect, test } from 'vitest';
import { useCartStore } from '@/stores/cartStore';
import { Product } from '@/types';

const inStockProduct = (overrides: Partial<Product> = {}): Product => ({
  _id: '507f1f77bcf86cd799439011',
  name: 'Hill\'s c/d',
  slug: 'hills-cd',
  description: 'desc',
  brand: "Hill's",
  category: 'food',
  images: ['https://example.com/a.jpg'],
  variants: [{ price: 20, sku: 'bag', stock: undefined as unknown as number }],
  basePrice: 20,
  averageRating: 0,
  totalReviews: 0,
  petType: 'cat',
  tags: [],
  features: [],
  isActive: true,
  isFeatured: false,
  inStock: true,
  totalStock: 9,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('cartStore addToCart', () => {
  test('adds an in-stock product even when the listing variant omits stock', () => {
    useCartStore.setState({ items: [] });
    const product = inStockProduct();
    const added = useCartStore.getState().addToCart(product, product.variants[0]);
    expect(added).toBe(true);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().getTotalItems()).toBe(1);
  });

  test('adds when the product is marked in stock even if totalStock is 0', () => {
    useCartStore.setState({ items: [] });
    const product = inStockProduct({
      totalStock: 0,
      inStock: true,
      variants: [{ price: 20, sku: 'bag', stock: undefined as unknown as number }],
    });
    const added = useCartStore.getState().addToCart(product, product.variants[0]);
    expect(added).toBe(true);
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  test('does not add a variant that is explicitly out of stock', () => {
    useCartStore.setState({ items: [] });
    const product = inStockProduct({
      variants: [{ price: 20, sku: 'bag', stock: 0 }],
      inStock: true,
      totalStock: 9,
    });
    const added = useCartStore.getState().addToCart(product, product.variants[0]);
    expect(added).toBe(false);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

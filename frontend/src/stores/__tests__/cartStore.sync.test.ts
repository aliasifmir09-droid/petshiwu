import { afterEach, describe, expect, test } from 'vitest';
import { useCartStore } from '@/stores/cartStore';
import { Product } from '@/types';

const inStockProduct = (): Product => ({
  _id: '507f1f77bcf86cd799439011',
  name: "Hill's c/d",
  slug: 'hills-cd',
  description: 'desc',
  brand: "Hill's",
  category: 'food',
  images: ['https://example.com/a.jpg'],
  variants: [{ price: 52.99, sku: '12lb', stock: 9 }],
  basePrice: 52.99,
  averageRating: 0,
  totalReviews: 0,
  petType: 'dog',
  tags: [],
  features: [],
  isActive: true,
  isFeatured: false,
  inStock: true,
  totalStock: 9,
  createdAt: '',
  updatedAt: '',
});

describe('cartStore cart-sync', () => {
  afterEach(() => {
    useCartStore.setState({ items: [] });
  });

  test('replaceItemsFromSync can change quantity once without a follow-up identity churn', () => {
    const product = inStockProduct();
    useCartStore.setState({
      items: [{ product, variant: product.variants[0], quantity: 1 }],
    });

    useCartStore.getState().replaceItemsFromSync([
      { product, variant: product.variants[0], quantity: 2 },
    ]);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
    expect(useCartStore.getState().getTotalPrice()).toBeCloseTo(105.98);

    const afterSync = useCartStore.getState().items;
    useCartStore.getState().replaceItemsFromSync([
      { product, variant: product.variants[0], quantity: 2 },
    ]);
    expect(useCartStore.getState().items).toBe(afterSync);

    useCartStore.getState().replaceItemsFromSync([
      { product, variant: product.variants[0], quantity: 1 },
    ]);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
    expect(useCartStore.getState().getTotalPrice()).toBeCloseTo(52.99);
  });
});

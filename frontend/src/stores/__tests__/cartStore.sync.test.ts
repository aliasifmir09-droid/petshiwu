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

const waitForSync = () => new Promise((resolve) => setTimeout(resolve, 25));

describe('cartStore cart-sync', () => {
  afterEach(() => {
    useCartStore.setState({ items: [] });
  });

  test('incoming cart-sync messages apply quantity without echoing back', async () => {
    if (typeof BroadcastChannel === 'undefined') return;

    useCartStore.setState({ items: [] });
    const product = inStockProduct();
    useCartStore.getState().addToCart(product, product.variants[0]);
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    const peer = new BroadcastChannel('cart-sync');
    let echoed = 0;
    peer.onmessage = () => {
      echoed += 1;
    };

    const current = JSON.parse(JSON.stringify(useCartStore.getState().items));
    peer.postMessage({ type: 'cart-update', items: current });
    await waitForSync();
    expect(echoed).toBe(0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    current[0].quantity = 2;
    peer.postMessage({ type: 'cart-update', items: current });
    await waitForSync();
    expect(useCartStore.getState().items[0].quantity).toBe(2);
    expect(useCartStore.getState().getTotalPrice()).toBeCloseTo(105.98);
    expect(echoed).toBe(0);

    current[0].quantity = 1;
    peer.postMessage({ type: 'cart-update', items: current });
    await waitForSync();
    expect(useCartStore.getState().items[0].quantity).toBe(1);
    expect(echoed).toBe(0);
    peer.close();
  });
});

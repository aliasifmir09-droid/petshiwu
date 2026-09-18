import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import type { Product } from '@/types';
import { FIRST_ORDER_CARD_LINE, REPEAT_ORDER_CARD_LINE } from '@/config/publicPromos';
import ProductCard from '../ProductCard';

vi.mock('@/stores/wishlistStore', () => ({
  useWishlistStore: () => ({
    isInWishlist: () => false,
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
  }),
}));

vi.mock('@/stores/cartStore', () => ({
  useCartStore: () => ({ addToCart: vi.fn(() => true) }),
}));

vi.mock('@/hooks/usePrefetch', () => ({
  usePrefetch: () => ({ prefetchProduct: vi.fn() }),
}));

vi.mock('@/hooks/useImageLoadTracker', () => ({
  useImageLoadTracker: () => ({ markImageFailed: vi.fn() }),
}));

vi.mock('../QuickViewModal', () => ({ default: () => null }));

const product = {
  _id: 'p1',
  name: 'Adams Plus Flea & Tick Spray',
  slug: 'adams-plus-flea-tick-spray',
  description: 'Spray',
  brand: 'Adams Plus',
  category: { _id: 'c1', name: 'Flea', slug: 'flea', petType: 'dog', isActive: true } as any,
  images: ['/adams.jpg'],
  petType: 'dog',
  basePrice: 14.99,
  compareAtPrice: 18.99,
  inStock: true,
  averageRating: 4.4,
  totalReviews: 19,
  variants: [],
} as unknown as Product;

describe('ProductCard', () => {
  test('shows photo, name, rating, price, and the two public offers', () => {
    const { container } = render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>
    );

    const image = screen.getByRole('img', { name: /adams plus flea/i });
    const name = screen.getByRole('heading', { name: /adams plus flea/i });
    expect(image.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('4.4')).toBeInTheDocument();
    expect(screen.getByText('(19)')).toBeInTheDocument();
    expect(container.textContent).toContain('$14.99');
    expect(screen.getByText(FIRST_ORDER_CARD_LINE)).toBeInTheDocument();
    expect(screen.getByText(REPEAT_ORDER_CARD_LINE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });
});

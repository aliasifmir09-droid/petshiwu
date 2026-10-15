import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ReactNode } from 'react';
import ProductCard from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import ProductDetail from '@/pages/ProductDetail';
import type { Product } from '@/types';
import { LAST_ZIP_STORAGE_KEY } from '@/utils/deliveryZip';
import {
  LOCAL_SAME_DAY_PROMISE,
  MIXED_CART_DELIVERY_SUMMARY,
  EXCLUDED_SHIPPING_MESSAGE,
  TOPDAWG_NOT_SAME_DAY_PROMISE,
  cartDeliverySummary,
  cartShipsNationwide,
  isAlaskaOrHawaiiAddress,
  localItemsBlockedOutsideNyc,
  productDeliveryPromise,
  quoteStorefrontDelivery,
} from '../deliveryLane';
import { NATIONWIDE_PAGE_PROMISE, NATIONWIDE_WINDOW } from '../deliveryZones';

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

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ isAuthenticated: false, user: null }),
}));

vi.mock('@/hooks/usePrefetch', () => ({
  usePrefetch: () => ({
    prefetchProduct: vi.fn(),
    prefetchRelatedProducts: vi.fn(),
    prefetchProductReviews: vi.fn(),
  }),
}));

vi.mock('@/services/products', () => {
  const productFor = (slug: string) => ({
    _id: slug,
    name: slug === 'lick-mat' ? 'Lick mat' : 'Queens kibble',
    slug,
    description: 'Soft toy',
    brand: 'Petshiwu',
    category: 'Toys',
    images: ['/item.jpg'],
    variants: [],
    basePrice: 19,
    averageRating: 0,
    totalReviews: 0,
    petType: 'dog',
    tags: slug === 'lick-mat' ? ['topdawg', 'td-category'] : ['dog'],
    features: [],
    isActive: true,
    isFeatured: false,
    inStock: true,
    totalStock: 8,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  });
  return {
    productService: {
      getProduct: (slug: string) => Promise.resolve(productFor(slug)),
      getProductById: (slug: string) => Promise.resolve(productFor(slug)),
      getRelatedProducts: () => Promise.resolve({ data: [] }),
    },
  };
});

vi.mock('@/services/reviews', () => ({
  reviewService: {
    getProductReviews: () => Promise.resolve({ data: [], total: 0, page: 1, limit: 10 }),
  },
}));

vi.mock('@/services/recommendations', () => ({
  recommendationService: {
    getRecommendations: () => Promise.resolve([]),
    getFrequentlyBoughtTogether: () => Promise.resolve([]),
    getCustomersAlsoBought: () => Promise.resolve([]),
  },
}));

const local = { tags: ['dog'], name: 'Queens kibble' };
const shipped = { tags: ['topdawg', 'td-category'], name: 'Dropship toy' };

const cardProduct = (topDawg: boolean): Product =>
  ({
    _id: topDawg ? 'lick-mat' : 'kibble',
    name: topDawg ? 'Lick mat' : 'Queens kibble',
    slug: topDawg ? 'lick-mat' : 'kibble',
    description: 'Soft toy',
    brand: 'Petshiwu',
    category: 'Toys',
    images: ['/item.jpg'],
    variants: [],
    basePrice: 19,
    averageRating: 0,
    totalReviews: 0,
    petType: 'dog',
    tags: topDawg ? ['topdawg', 'td-category'] : ['dog'],
    features: [],
    isActive: true,
    isFeatured: false,
    inStock: true,
    totalStock: 8,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }) as unknown as Product;

function withProviders(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

function renderItemPage(slug: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/products/${slug}`]}>
          <Routes>
            <Route path="/products/:slug" element={<ProductDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

describe('product delivery promises', () => {
  test('old-catalog items are same-day in NYC and nationwide everywhere else', () => {
    expect(productDeliveryPromise(local, '11372')).toBe(LOCAL_SAME_DAY_PROMISE);
    expect(productDeliveryPromise(local, '')).toBe(LOCAL_SAME_DAY_PROMISE);
    expect(productDeliveryPromise(local, '07030')).toBe(NATIONWIDE_WINDOW);
    expect(productDeliveryPromise(local, '94105')).toBe(NATIONWIDE_WINDOW);
    expect(productDeliveryPromise(local, '99501', 'AK')).toBe(EXCLUDED_SHIPPING_MESSAGE);
  });

  test('topdawg items are not eligible for same-day delivery, including NYC zips', () => {
    expect(productDeliveryPromise(shipped, '11372')).toBe(TOPDAWG_NOT_SAME_DAY_PROMISE);
    expect(productDeliveryPromise(shipped, '10001')).toBe(TOPDAWG_NOT_SAME_DAY_PROMISE);
    expect(productDeliveryPromise(shipped, '07030')).toBe(TOPDAWG_NOT_SAME_DAY_PROMISE);
    expect(productDeliveryPromise(shipped, '11372')).not.toMatch(/order by 3 pm/i);
    expect(productDeliveryPromise(shipped, '11372')).not.toBe(LOCAL_SAME_DAY_PROMISE);
  });

  test('a mixed cart promises each lane separately', () => {
    expect(cartDeliverySummary([{ product: shipped }, { product: local }])).toBe(MIXED_CART_DELIVERY_SUMMARY);
    expect(cartDeliverySummary([{ product: shipped }, { product: local }], { state: 'NJ', zipCode: '07030' })).toBe(
      NATIONWIDE_WINDOW
    );
    expect(cartDeliverySummary([{ product: local }], { state: 'CA', zipCode: '90001' })).toBe(NATIONWIDE_WINDOW);
    expect(cartDeliverySummary([{ product: shipped }])).toBe(TOPDAWG_NOT_SAME_DAY_PROMISE);
    expect(cartDeliverySummary([{ product: local }])).toBeNull();
    expect(productDeliveryPromise(shipped, '11372')).not.toBe(productDeliveryPromise(local, '11372'));
  });

  test('a non-NYC cart ships only when every item is TopDawg', () => {
    const hoboken = { state: 'NJ', zipCode: '07030', country: 'USA' };
    expect(cartShipsNationwide([{ product: shipped }], hoboken)).toBe(true);
    expect(cartShipsNationwide([{ product: shipped }, { product: local }], hoboken)).toBe(false);
    expect(localItemsBlockedOutsideNyc([{ product: local }], hoboken)).toBe(false);
    expect(localItemsBlockedOutsideNyc([{ product: local }], { state: 'CA', zipCode: '90001', country: 'USA' })).toBe(false);
    expect(localItemsBlockedOutsideNyc([{ product: shipped }, { product: local }], { state: 'NY', zipCode: '11372', country: 'USA' })).toBe(false);
  });
});

describe('TopDawg same-day exclusion on the item page', () => {
  beforeEach(() => {
    window.localStorage.clear();
    class MockObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('IntersectionObserver', MockObserver);
  });

  test('TopDawg item page renders the not-eligible string and hides the same-day widget for an NYC ZIP', async () => {
    window.localStorage.setItem(LAST_ZIP_STORAGE_KEY, '11372');
    renderItemPage('lick-mat');

    expect(await screen.findByRole('heading', { name: 'Lick mat' })).toBeInTheDocument();
    expect(screen.getAllByText(TOPDAWG_NOT_SAME_DAY_PROMISE).length).toBeGreaterThan(0);
    expect(screen.getAllByText(EXCLUDED_SHIPPING_MESSAGE).length).toBeGreaterThan(0);
    expect(isAlaskaOrHawaiiAddress('AK', '99501')).toBe(true);
    expect(isAlaskaOrHawaiiAddress('Hawaii', '96813')).toBe(true);
    expect(isAlaskaOrHawaiiAddress('CA', '94105')).toBe(false);
    expect(screen.queryByText(/ready to ship/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/eligible for same-day delivery in/i)).not.toBeInTheDocument();
    expect(screen.queryByText(LOCAL_SAME_DAY_PROMISE)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/check delivery by zip code/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/order by 3 pm/i)).not.toBeInTheDocument();
  });

  test('a local item page in New Jersey shows the 2-5 day window and hides the same-day widget', async () => {
    window.localStorage.setItem(LAST_ZIP_STORAGE_KEY, '07030');
    renderItemPage('kibble');

    expect(await screen.findByRole('heading', { name: 'Queens kibble' })).toBeInTheDocument();
    expect(screen.getByText(NATIONWIDE_PAGE_PROMISE)).toBeInTheDocument();
    expect(screen.queryByLabelText(/check delivery by zip code/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/order by 3 pm/i)).not.toBeInTheDocument();
  });

  test('a local item page still shows the same-day widget for an NYC ZIP', async () => {
    window.localStorage.setItem(LAST_ZIP_STORAGE_KEY, '11372');
    renderItemPage('kibble');

    expect(await screen.findByRole('heading', { name: 'Queens kibble' })).toBeInTheDocument();
    expect(screen.getByText(/ready to ship/i)).toBeInTheDocument();
    expect(screen.getAllByText(LOCAL_SAME_DAY_PROMISE).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/check delivery by zip code/i)).toBeInTheDocument();
  });

  test('TopDawg product card and quick view hide the same-day widget for an NYC ZIP', async () => {
    window.localStorage.setItem(LAST_ZIP_STORAGE_KEY, '11372');
    render(
      withProviders(
        <>
          <ProductCard product={cardProduct(true)} />
          <QuickViewModal productSlug="lick-mat" isOpen onClose={() => {}} />
        </>
      )
    );

    expect(await screen.findByRole('heading', { name: 'Lick mat', level: 2 })).toBeInTheDocument();
    expect(screen.getAllByText(TOPDAWG_NOT_SAME_DAY_PROMISE).length).toBeGreaterThan(0);
    expect(screen.queryByText(/ready to ship/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/check delivery by zip code/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/order by 3 pm/i)).not.toBeInTheDocument();
  });
});

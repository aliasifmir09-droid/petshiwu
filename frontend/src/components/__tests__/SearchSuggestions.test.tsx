import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import SearchSuggestions from '../SearchSuggestions';

vi.mock('@/services/products', () => ({
  productService: {
    getSearchSuggestions: vi.fn().mockResolvedValue({
      success: true,
      data: {
        products: [
          {
            _id: '1',
            name: 'Blue Buffalo Life Protection Formula',
            slug: 'blue-buffalo-life-protection-formula',
            petType: 'dog',
            brand: 'Blue Buffalo',
            basePrice: 39.99,
            category: { slug: 'dry-food', name: 'Dry Food' },
          },
          {
            _id: '2',
            name: 'Blue Buffalo Baby BLUE Puppy Training Treats',
            slug: 'blue-buffalo-baby-blue-puppy-training-treats-natural-chicken',
            brand: 'Blue Buffalo',
            basePrice: 5.99,
          },
        ],
        categories: [],
      },
    }),
  },
}));

const renderSuggestions = (onSelect: ReturnType<typeof vi.fn>, onClose: ReturnType<typeof vi.fn>) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={<SearchSuggestions query="blue buffalo" isOpen onSelect={onSelect} onClose={onClose} />}
          />
          <Route path="/dog/:category/:slug" element={<div>product page</div>} />
          <Route path="/products/:slug" element={<div>product page</div>} />
          <Route path="/search" element={<div>search page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('SearchSuggestions', () => {
  test('product click goes to the product URL and does not run a new search', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    renderSuggestions(onSelect, onClose);

    const link = await screen.findByRole('link', { name: /blue buffalo life protection formula/i });
    expect(link).toHaveAttribute(
      'href',
      '/dog/dry-food/blue-buffalo-life-protection-formula'
    );
    fireEvent.click(link);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(screen.getByText('product page')).toBeInTheDocument();
  });

  test('live autocomplete without category still opens /products/:slug', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    renderSuggestions(onSelect, onClose);

    const link = await screen.findByRole('link', { name: /baby blue puppy training treats/i });
    expect(link).toHaveAttribute(
      'href',
      '/products/blue-buffalo-baby-blue-puppy-training-treats-natural-chicken'
    );
    fireEvent.click(link);
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByText('product page')).toBeInTheDocument();
  });

  test('view-all stays on search results for that query', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    renderSuggestions(onSelect, onClose);

    const viewAll = await screen.findByRole('link', { name: /view all results for "blue buffalo"/i });
    expect(viewAll).toHaveAttribute('href', '/search?q=blue%20buffalo');
    fireEvent.click(viewAll);
    expect(onSelect).toHaveBeenCalledWith('blue buffalo');
  });
});

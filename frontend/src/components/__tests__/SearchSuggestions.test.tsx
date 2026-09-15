import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
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
      <MemoryRouter>
        <SearchSuggestions query="blue buffalo" isOpen onSelect={onSelect} onClose={onClose} />
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

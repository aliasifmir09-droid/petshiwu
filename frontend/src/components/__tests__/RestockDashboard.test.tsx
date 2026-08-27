import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import RestockDashboard from '../RestockDashboard';
import { buyAgainService } from '@/services/buyAgain';

vi.mock('@/services/buyAgain', () => ({
  buyAgainService: {
    getBuyAgain: vi.fn(),
    createReminder: vi.fn(),
    cancelReminder: vi.fn(),
  },
}));

vi.mock('@/services/products', () => ({
  productService: {
    search: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { firstName: 'Sam', pets: [{ petName: 'Jawed' }] },
  }),
}));

vi.mock('@/stores/cartStore', () => ({
  useCartStore: (selector: (state: { addToCart: () => boolean }) => unknown) =>
    selector({ addToCart: vi.fn(() => true) }),
}));

vi.mock('@/config/launch', () => ({
  areOrdersOpen: () => true,
}));

const payload = {
  lastOrder: {
    _id: 'o1',
    orderNumber: 'ORD-1787843707561-4371',
    orderStatus: 'delivered',
    createdAt: '2026-08-27',
    totalPrice: 18,
    items: [
      {
        product: 'p1',
        name: "McLovin's Salmon freeze-dried topper",
        quantity: 1,
        image: 'https://example.com/topper.jpg',
      },
    ],
  },
  usual: [
    {
      product: 'p1',
      name: "McLovin's Salmon freeze-dried topper",
      quantity: 1,
      image: 'https://example.com/topper.jpg',
    },
  ],
  regulars: [
    {
      productId: 'p2',
      name: "Hill's Science Diet",
      image: '',
      lastPrice: 18,
      lastQuantity: 1,
      timesOrdered: 2,
      lastOrderedAt: '2026-08-01',
      restockable: true,
    },
  ],
  reminder: null,
};

const renderDashboard = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <RestockDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('RestockDashboard cart', () => {
  test('lets a customer add and remove restock items and pick cadence plus a time', async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.mocked(buyAgainService.getBuyAgain).mockResolvedValue(payload as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Your restock cart')).toBeInTheDocument();
    });

    expect(screen.getByText(/Search to add/i)).toBeInTheDocument();
    expect(screen.getByText('How do you want to pay?')).toBeInTheDocument();
    expect(screen.getAllByText(/Ready to ship/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("McLovin's Salmon freeze-dried topper").length).toBeGreaterThan(0);

    const cadence = screen.getByLabelText('How often to restock') as HTMLSelectElement;
    expect(cadence.value).toBe('7');
    expect(screen.getByRole('option', { name: 'Every day' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Every week' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Every 8 weeks' })).toBeInTheDocument();
    expect(screen.getByLabelText('Next restock email date')).toBeInTheDocument();
    expect(screen.getByLabelText('Next restock email time')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: "Remove McLovin's Salmon freeze-dried topper from cart" }));
    expect(screen.queryAllByText("McLovin's Salmon freeze-dried topper")).toHaveLength(0);
    expect(screen.getByText(/Cart is empty/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: "+ Hill's Science Diet" }));
    expect(screen.getAllByText("Hill's Science Diet").length).toBeGreaterThan(0);
    expect(screen.getByText(/Added to your restock cart/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Remove Hill's Science Diet from cart" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Apple Pay/i }));
    expect(screen.getAllByText('Apple Pay').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Pay and ship now/i })).toBeEnabled();
  });
});

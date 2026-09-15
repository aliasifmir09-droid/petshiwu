import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import TonightPromiseCard from '../TonightPromiseCard';

describe('TonightPromiseCard', () => {
  test('hero asks for a ZIP and confirms Queens same-day coverage', () => {
    render(
      <MemoryRouter>
        <TonightPromiseCard />
      </MemoryRouter>
    );

    expect(screen.getByText(/tonight at your door/i)).toBeInTheDocument();
    expect(screen.getByText(/packed in jackson heights/i)).toBeInTheDocument();
    expect(screen.getByText(/no autoship/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /shop now/i })).toHaveAttribute('href', '/products');

    fireEvent.change(screen.getByLabelText(/check same-day delivery by zip code/i), {
      target: { value: '11372' },
    });
    expect(screen.getByText(/queens/i)).toBeInTheDocument();
  });

  test('product card keeps the ZIP check next to add to cart', () => {
    render(
      <MemoryRouter>
        <TonightPromiseCard variant="pdp" />
      </MemoryRouter>
    );

    expect(screen.getByText(/tonight in nyc/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/check same-day delivery by zip code/i), {
      target: { value: '11201' },
    });
    expect(screen.getByText(/brooklyn/i)).toBeInTheDocument();
  });
});

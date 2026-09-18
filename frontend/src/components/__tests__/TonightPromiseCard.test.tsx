import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, beforeEach } from 'vitest';
import TonightPromiseCard from '../TonightPromiseCard';

describe('TonightPromiseCard', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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
    expect(screen.getByText(/same-day delivery in queens/i)).toBeInTheDocument();
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
    expect(screen.getAllByText(/brooklyn/i).length).toBeGreaterThan(0);
  });
});

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import HomeWelcomeTrust from '../HomeWelcomeTrust';
import { FIRST_ORDER_CODE } from '@/config/publicPromos';

describe('HomeWelcomeTrust', () => {
  test('puts first-order offer, no-autoship, and returns next to a live phone line', () => {
    render(
      <MemoryRouter>
        <HomeWelcomeTrust />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /a real store/i })).toBeInTheDocument();
    expect(screen.getByText(FIRST_ORDER_CODE)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no autoship/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /365-day returns/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start shopping/i })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('link', { name: /shop the offer/i })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('link', { name: /read our promise/i })).toHaveAttribute('href', '/our-promise');
    expect(screen.getAllByText(/800/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/paypal or card/i).length).toBeGreaterThan(0);
  });
});

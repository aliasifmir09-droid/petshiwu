import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import HomeWelcomeTrust from '../HomeWelcomeTrust';
import { FIRST_ORDER_CODE } from '@/config/publicPromos';

describe('HomeWelcomeTrust', () => {
  test('puts first-order offer, no-autoship, and a live phone line in one row', () => {
    render(
      <MemoryRouter>
        <HomeWelcomeTrust />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: FIRST_ORDER_CODE })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no autoship/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /call 24\/7/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(`use ${FIRST_ORDER_CODE}`, 'i') })).toHaveAttribute(
      'href',
      '/products'
    );
    expect(screen.getByRole('link', { name: /our promise/i })).toHaveAttribute('href', '/our-promise');
    expect(screen.getByRole('link', { name: /talk to a person/i })).toHaveAttribute(
      'href',
      'tel:+18002592605'
    );
  });
});

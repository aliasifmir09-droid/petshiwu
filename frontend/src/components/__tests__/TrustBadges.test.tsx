import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import TrustBadges from '../TrustBadges';

describe('TrustBadges', () => {
  test('shows the nationwide storefront promises', () => {
    render(<TrustBadges />);

    expect(screen.getByRole('heading', { name: /secure checkout/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /365-day returns/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /free shipping \$49\+/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /nationwide 2-5 business days/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /nyc same-day on local stock/i })).toBeInTheDocument();
  });
});

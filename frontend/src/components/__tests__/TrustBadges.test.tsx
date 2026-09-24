import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import TrustBadges from '../TrustBadges';

describe('TrustBadges', () => {
  test('shows checkout and return promises shoppers look for', () => {
    render(<TrustBadges />);

    expect(screen.getByRole('heading', { name: /free over \$49/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no autoship/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /365-day returns/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /paypal or card/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /same-day nyc/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /call 24\/7/i })).toBeInTheDocument();
  });
});

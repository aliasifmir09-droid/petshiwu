import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import CookiePolicy from '@/pages/CookiePolicy';

describe('Cookie Policy page', () => {
  test('is a cookie inventory, not a Privacy Policy duplicate', () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <CookiePolicy />
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(screen.getByRole('heading', { level: 1, name: /cookie policy/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: /privacy policy/i })).not.toBeInTheDocument();
    expect(screen.getByText(/how to change consent later/i)).toBeInTheDocument();
    expect(screen.getByText('Google LLC (Google Analytics 4)')).toBeInTheDocument();
    expect(screen.getAllByText('First-party').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Third-party').length).toBeGreaterThan(0);
  });
});

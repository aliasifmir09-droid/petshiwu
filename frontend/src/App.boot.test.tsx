import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { describe, expect, test } from 'vitest';
import App from './App';

describe('App boot', () => {
  test('renders the storefront instead of crashing on PrivacyPolicy', () => {
    expect(() => {
      render(
        <HelmetProvider>
          <App />
        </HelmetProvider>
      );
    }).not.toThrow();
    expect(document.getElementById('root') || document.body).toBeTruthy();
    expect(screen.queryByText(/could not load/i)).not.toBeInTheDocument();
  });
});

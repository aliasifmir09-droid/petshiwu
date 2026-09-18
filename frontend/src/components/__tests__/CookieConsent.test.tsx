import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { COOKIE_CONSENT_STORAGE_KEY } from '@/config/cookies';
import CookieConsent from '../CookieConsent';

vi.mock('@/utils/analytics', () => ({
  initAnalytics: vi.fn(),
}));

afterEach(() => {
  vi.useRealTimers();
  localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
});

const renderOn = (path: string) => {
  localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  vi.useFakeTimers();
  render(
    <MemoryRouter initialEntries={[path]}>
      <CookieConsent />
    </MemoryRouter>
  );
  act(() => {
    vi.advanceTimersByTime(900);
  });
};

describe('CookieConsent', () => {
  test('sits above the mobile cart checkout bar so Proceed to Checkout stays tappable', () => {
    renderOn('/cart');
    const dialog = screen.getByRole('dialog', { name: /cookie consent/i });
    expect(dialog.className).toContain('bottom-44');
    expect(dialog.className).not.toContain('top-16');
  });

  test('moves to the top on checkout so PayPal is not covered', () => {
    renderOn('/checkout');
    const dialog = screen.getByRole('dialog', { name: /cookie consent/i });
    expect(dialog.className).toContain('top-16');
  });
});

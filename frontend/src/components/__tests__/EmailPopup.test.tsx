import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import EmailPopup from '../EmailPopup';
import { EMAIL_POPUP_DELAY_MS, EMAIL_POPUP_STORAGE_KEY } from '@/utils/emailPopup';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: false }),
}));

const renderPopup = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <EmailPopup />
    </MemoryRouter>
  );

describe('EmailPopup', () => {
  beforeEach(() => {
    localStorage.removeItem(EMAIL_POPUP_STORAGE_KEY);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.removeItem(EMAIL_POPUP_STORAGE_KEY);
  });

  test('does not show immediately, then opens after 5 seconds', () => {
    renderPopup('/');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(EMAIL_POPUP_DELAY_MS - 1);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('dialog', { name: /unlock 20% off on your first order/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /email me 20% off/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no, thank you/i })).toBeInTheDocument();
  });

  test('does not open on checkout even after 5 seconds', () => {
    renderPopup('/checkout');
    act(() => {
      vi.advanceTimersByTime(EMAIL_POPUP_DELAY_MS + 100);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

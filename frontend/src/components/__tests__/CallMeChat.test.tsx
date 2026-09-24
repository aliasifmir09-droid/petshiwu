import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import CallMeChat from '../CallMeChat';

const post = vi.fn();

vi.mock('@/services/api', () => ({
  default: {
    post: (...args: unknown[]) => post(...args),
  },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { user: null }) => unknown) => selector({ user: null }),
}));

const renderChat = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <CallMeChat />
    </MemoryRouter>
  );

describe('CallMeChat', () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({
      data: {
        success: true,
        phone: '+1 (347) 555-0100',
        message: 'We are calling +1 (347) 555-0100 now. Stay by the phone — a person will ring you within a minute.',
      },
    });
  });

  test('is hidden on checkout', () => {
    renderChat('/checkout');
    expect(screen.queryByRole('button', { name: /open call me chat/i })).not.toBeInTheDocument();
  });

  test('sends a dropped number to the callback desk', async () => {
    renderChat('/');
    fireEvent.click(screen.getByRole('button', { name: /open call me chat/i }));
    fireEvent.change(screen.getByLabelText(/your phone number/i), {
      target: { value: '347-555-0100' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        '/v1/contact/callback',
        expect.objectContaining({
          phone: '+13475550100',
          pagePath: '/',
        }),
        { skipAuth: true }
      );
    });
    expect(await screen.findByText(/we are calling \+1 \(347\) 555-0100 now/i)).toBeInTheDocument();
  });
});

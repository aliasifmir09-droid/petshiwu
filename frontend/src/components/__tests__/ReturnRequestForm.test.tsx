import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import ReturnRequestForm from '@/components/ReturnRequestForm';
import api from '@/services/api';

vi.mock('@/services/api', () => ({
  default: { post: vi.fn() },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ user: null }),
}));

describe('ReturnRequestForm', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  test('submits order number, email, and reason and shows a reference', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });
    render(
      <MemoryRouter>
        <ReturnRequestForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/^Name$/), { target: { value: 'Jawed' } });
    fireEvent.change(screen.getByLabelText(/^Email$/), { target: { value: 'jawed@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Order number$/), { target: { value: 'ORD-1787843707561-4371' } });
    fireEvent.click(screen.getByRole('button', { name: /submit return request/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/v1/contact/general',
        expect.objectContaining({
          name: 'Jawed',
          email: 'jawed@example.com',
          subject: 'return',
        }),
        { skipAuth: true }
      );
    });
    expect(screen.getByText(/return request received/i)).toBeInTheDocument();
    expect(screen.getByText(/RET-/)).toBeInTheDocument();
  });
});

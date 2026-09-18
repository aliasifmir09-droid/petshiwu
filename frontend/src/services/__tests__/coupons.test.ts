import { beforeEach, describe, expect, test, vi } from 'vitest';
import api from '../api';
import { applyCheckoutCode, recordCheckoutCodeUse } from '../coupons';

vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('checkout code service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('validates on the same-origin checkout path, not /coupons', async () => {
    (api.post as any).mockResolvedValue({
      data: { valid: true, freeShipping: true, discountAmount: 0 },
    });

    const result = await applyCheckoutCode({
      code: 'TEST',
      subtotal: 0.51,
      email: 'ops@example.com',
    });

    expect(api.post).toHaveBeenCalledWith(
      '/v1/checkout/code/validate',
      { code: 'TEST', subtotal: 0.51, email: 'ops@example.com' },
      { baseURL: '/api', skipAuth: true }
    );
    expect(result.valid).toBe(true);
    expect(result.freeShipping).toBe(true);
  });

  test('records usage on the same-origin checkout path', async () => {
    (api.post as any).mockResolvedValue({ data: { success: true } });

    await recordCheckoutCodeUse({
      code: 'WELCOME10',
      email: 'guest@example.com',
      orderId: 'ord-1',
    });

    expect(api.post).toHaveBeenCalledWith(
      '/v1/checkout/code/use',
      { code: 'WELCOME10', email: 'guest@example.com', orderId: 'ord-1' },
      { baseURL: '/api', skipAuth: true }
    );
  });
});

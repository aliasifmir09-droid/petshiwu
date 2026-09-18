import api from './api';
import type { CheckoutCodeApiResult } from '@/utils/checkoutCoupon';

/** Same-origin so apex/www and a baked VITE_API_URL cannot CORS-fail this call. */
const sameOrigin = { baseURL: '/api', skipAuth: true as const };

export const applyCheckoutCode = async (payload: {
  code: string;
  subtotal: number;
  email?: string;
}): Promise<CheckoutCodeApiResult> => {
  const response = await api.post<CheckoutCodeApiResult>(
    '/v1/checkout/code/validate',
    payload,
    sameOrigin
  );
  return response.data;
};

export const recordCheckoutCodeUse = async (payload: {
  code: string;
  email: string;
  orderId?: string;
}): Promise<void> => {
  await api.post('/v1/checkout/code/use', payload, sameOrigin);
};

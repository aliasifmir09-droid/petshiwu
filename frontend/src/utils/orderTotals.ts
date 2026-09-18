import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST } from '@/config/constants';

/** Matches checkout and the API: free shipping at $49, not only above it. */
export const shippingCostForSubtotal = (subtotal: number, waiveShipping = false): number =>
  waiveShipping || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;

export const amountUntilFreeShipping = (subtotal: number): number =>
  Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST } from '@/config/constants';

/** One order fee: $7 delivery under $49, free at $49, including NYC and TopDawg. */
export const shippingCostForSubtotal = (
  subtotal: number,
  waiveShipping = false,
  _nationwideFlat = false
): number => {
  return waiveShipping || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
};

export const amountUntilFreeShipping = (subtotal: number): number =>
  Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

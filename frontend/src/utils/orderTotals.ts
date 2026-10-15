import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST } from '@/config/constants';
import { NATIONWIDE_SHIPPING_COST } from '@/utils/deliveryLane';

/** Matches checkout and the API: free shipping at $49, not only above it. Nationwide TopDawg orders are a flat $7. */
export const shippingCostForSubtotal = (
  subtotal: number,
  waiveShipping = false,
  nationwideFlat = false
): number => {
  if (nationwideFlat) return NATIONWIDE_SHIPPING_COST;
  return waiveShipping || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
};

export const amountUntilFreeShipping = (subtotal: number): number =>
  Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

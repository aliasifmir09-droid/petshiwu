export type Coupon = {
  type: 'percent' | 'fixed';
  value: number;
  /** Optional dollar cap for percent codes (FREEDOM20 is 20% off, max $10). */
  maxDiscount?: number;
  description: string;
};

export const COUPONS: Record<string, Coupon> = {
  WELCOME10: { type: 'percent', value: 10, description: '10% off your first order' },
  NYC10: { type: 'percent', value: 10, description: '10% off for NYC pet parents' },
  PETDAY10: { type: 'percent', value: 10, description: '10% off — National Pet Day' },
  WORLDCUP: { type: 'percent', value: 10, description: '10% off — World Cup 2026 🇺🇸⚽' },
  FREEDOM20: { type: 'percent', value: 20, maxDiscount: 10, description: '20% off first order (max $10, no autoship)' },
};

export const getCouponDiscount = (code: string | undefined, subtotal: number): number => {
  if (!code) return 0;
  const coupon = COUPONS[code.trim().toUpperCase()];
  if (!coupon) return 0;

  const amount = Number(subtotal) || 0;
  if (amount <= 0) return 0;

  if (coupon.type === 'percent') {
    const raw = (amount * coupon.value) / 100;
    const capped = coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw;
    return Number(Math.max(0, capped).toFixed(2));
  }

  return Number(Math.min(coupon.value, amount).toFixed(2));
};

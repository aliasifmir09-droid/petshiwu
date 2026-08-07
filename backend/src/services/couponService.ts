export const COUPONS: Record<string, { type: 'percent' | 'fixed'; value: number; description: string }> = {
  WELCOME10: { type: 'percent', value: 10, description: '10% off your first order' },
  NYC10: { type: 'percent', value: 10, description: '10% off for NYC pet parents' },
  PETDAY10: { type: 'percent', value: 10, description: '10% off — National Pet Day' },
  WORLDCUP: { type: 'percent', value: 10, description: '10% off — World Cup 2026 🇺🇸⚽' }
};

export const getCouponDiscount = (code: string | undefined, subtotal: number): number => {
  if (!code) return 0;
  const coupon = COUPONS[code.trim().toUpperCase()];
  if (!coupon) return 0;

  if (coupon.type === 'percent') {
    const raw = (subtotal * coupon.value) / 100;
    return Number(Math.min(raw, coupon.value).toFixed(2));
  }

  return Number(Math.min(coupon.value, subtotal).toFixed(2));
};

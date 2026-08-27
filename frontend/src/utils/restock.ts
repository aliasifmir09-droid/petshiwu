export const RESTOCK_COUPON = 'RESTOCK7';
export const RESTOCK_COUPON_STORAGE_KEY = 'petshiwu_restock_coupon';
export const RESTOCK_DISCOUNT_COPY = '7% off, max $10';
export const REMINDER_WEEK_OPTIONS = [3, 4, 5, 6] as const;
export const RESTOCK_MODES = ['ask', 'autoship'] as const;
export type RestockMode = (typeof RESTOCK_MODES)[number];

export const rememberRestockCoupon = (): void => {
  try {
    sessionStorage.setItem(RESTOCK_COUPON_STORAGE_KEY, RESTOCK_COUPON);
  } catch {
    // private mode
  }
};

export const readRestockCoupon = (): string => {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = (params.get('coupon') || '').trim().toUpperCase();
    if (fromUrl === RESTOCK_COUPON) return RESTOCK_COUPON;
    const stored = (sessionStorage.getItem(RESTOCK_COUPON_STORAGE_KEY) || '').trim().toUpperCase();
    return stored === RESTOCK_COUPON ? RESTOCK_COUPON : '';
  } catch {
    return '';
  }
};

export const clearRestockCoupon = (): void => {
  try {
    sessionStorage.removeItem(RESTOCK_COUPON_STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const isAskFirstRestock = (): boolean => readRestockCoupon() === RESTOCK_COUPON;

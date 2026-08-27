export const ASK_COUPON = 'RESTOCK5';
export const AUTOSHIP_COUPON = 'RESTOCK7';
export const RESTOCK_COUPON = ASK_COUPON;
export const RESTOCK_COUPON_STORAGE_KEY = 'petshiwu_restock_coupon';
export const ASK_DISCOUNT_COPY = '5% off, max $10';
export const AUTOSHIP_DISCOUNT_COPY = '7% off, max $10';
export const RESTOCK_DISCOUNT_COPY = ASK_DISCOUNT_COPY;
export const REMINDER_WEEK_OPTIONS = [3, 4, 5, 6] as const;
export const RESTOCK_MODES = ['ask', 'autoship'] as const;
export type RestockMode = (typeof RESTOCK_MODES)[number];

export type RestockPick = {
  product: string;
  name: string;
  image: string;
  quantity: number;
  sku?: string;
};

const RESTOCK_EXCLUDE =
  /\b(toy|toys|costume|costumes|apparel|bed|beds|collar|collars|leash|leashes|harness|crate|carrier|furniture|scratch(er|ing)?|hoodie|shirt|bandana|bowl|bowls|feeder|fountain|litter[- ]?box|outfit|dress|halloween)\b/i;

export const isRestockConsumable = (haystack: string): boolean => {
  const text = String(haystack || '');
  if (!text.trim()) return false;
  if (RESTOCK_EXCLUDE.test(text) && !/\b(food|treat|treats|kibble|diet|meal|litter)\b/i.test(text)) {
    return false;
  }
  return true;
};

export const restockCouponForMode = (mode: RestockMode): string =>
  mode === 'autoship' ? AUTOSHIP_COUPON : ASK_COUPON;

export const restockDiscountCopy = (mode: RestockMode): string =>
  mode === 'autoship' ? AUTOSHIP_DISCOUNT_COPY : ASK_DISCOUNT_COPY;

export const isRestockCoupon = (code: string): boolean =>
  code === ASK_COUPON || code === AUTOSHIP_COUPON;

export const rememberRestockCoupon = (code: string = ASK_COUPON): void => {
  try {
    const normalized = code.trim().toUpperCase();
    if (!isRestockCoupon(normalized)) return;
    sessionStorage.setItem(RESTOCK_COUPON_STORAGE_KEY, normalized);
  } catch {
    // private mode
  }
};

export const readRestockCoupon = (): string => {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = (params.get('coupon') || '').trim().toUpperCase();
    if (isRestockCoupon(fromUrl)) return fromUrl;
    const stored = (sessionStorage.getItem(RESTOCK_COUPON_STORAGE_KEY) || '').trim().toUpperCase();
    return isRestockCoupon(stored) ? stored : '';
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

export const pickKey = (item: { product?: string; sku?: string }): string =>
  `${item.product || ''}::${item.sku || ''}`;

export const ASK_COUPON = 'RESTOCK5';
export const AUTOSHIP_COUPON = 'RESTOCK7';
export const RESTOCK_COUPON = ASK_COUPON;
export const RESTOCK_COUPON_STORAGE_KEY = 'petshiwu_restock_coupon';
export const RESTOCK_PAY_STORAGE_KEY = 'petshiwu_restock_pay';
export const RESTOCK_PAY_OPTIONS = [
  { id: 'apple_pay', label: 'Apple Pay', hint: 'iPhone, iPad, or Mac' },
  { id: 'google_pay', label: 'Google Pay', hint: 'Android or Chrome' },
  { id: 'paypal', label: 'PayPal or Venmo', hint: 'PayPal protected' },
  { id: 'credit_card', label: 'Credit or debit card', hint: 'Visa, Mastercard, Amex' },
] as const;
export type RestockPayMethod = (typeof RESTOCK_PAY_OPTIONS)[number]['id'];
export const ASK_DISCOUNT_COPY = '5% off, max $10';
export const AUTOSHIP_DISCOUNT_COPY = '7% off, max $10';
export const RESTOCK_DISCOUNT_COPY = ASK_DISCOUNT_COPY;
export const RESTOCK_CADENCE = [
  { intervalDays: 1, label: 'Every day' },
  { intervalDays: 7, label: 'Every week' },
  { intervalDays: 14, label: 'Every 2 weeks' },
  { intervalDays: 21, label: 'Every 3 weeks' },
  { intervalDays: 28, label: 'Every 4 weeks' },
  { intervalDays: 35, label: 'Every 5 weeks' },
  { intervalDays: 42, label: 'Every 6 weeks' },
  { intervalDays: 56, label: 'Every 8 weeks' },
] as const;
export const DEFAULT_INTERVAL_DAYS = 7;
export type RestockIntervalDays = (typeof RESTOCK_CADENCE)[number]['intervalDays'];
export const RESTOCK_MODES = ['ask', 'autoship'] as const;
export type RestockMode = (typeof RESTOCK_MODES)[number];

export type RestockPick = {
  product: string;
  name: string;
  image: string;
  quantity: number;
  sku?: string;
  price?: number;
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

export const isRestockPayMethod = (value: unknown): value is RestockPayMethod =>
  RESTOCK_PAY_OPTIONS.some((option) => option.id === value);

export const restockPayLabel = (method: RestockPayMethod): string =>
  RESTOCK_PAY_OPTIONS.find((option) => option.id === method)?.label || 'PayPal';

export const rememberRestockPay = (method: RestockPayMethod): void => {
  try {
    sessionStorage.setItem(RESTOCK_PAY_STORAGE_KEY, method);
  } catch {
    // private mode
  }
};

export const readRestockPay = (): RestockPayMethod | '' => {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('pay');
    if (isRestockPayMethod(fromUrl)) return fromUrl;
    const stored = sessionStorage.getItem(RESTOCK_PAY_STORAGE_KEY);
    return isRestockPayMethod(stored) ? stored : '';
  } catch {
    return '';
  }
};

export const clearRestockPay = (): void => {
  try {
    sessionStorage.removeItem(RESTOCK_PAY_STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const pickKey = (item: { product?: string; sku?: string }): string =>
  `${item.product || ''}::${item.sku || ''}`;

export const isValidIntervalDays = (days: unknown): days is RestockIntervalDays =>
  typeof days === 'number' && Number.isInteger(days) && RESTOCK_CADENCE.some((row) => row.intervalDays === days);

export const cadenceLabel = (intervalDays: number): string =>
  RESTOCK_CADENCE.find((row) => row.intervalDays === intervalDays)?.label || `Every ${intervalDays} days`;

export const pad2 = (n: number): string => String(n).padStart(2, '0');

export const localDateStr = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const localTimeStr = (d: Date): string => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

export const defaultRemindParts = (intervalDays: number, from: Date = new Date()): { date: string; time: string } => {
  const d = new Date(from);
  d.setDate(d.getDate() + Math.max(1, intervalDays));
  d.setHours(9, 0, 0, 0);
  return { date: localDateStr(d), time: localTimeStr(d) };
};

export const remindAtIso = (date: string, time: string): string => {
  const d = new Date(`${date}T${time || '09:00'}:00`);
  if (Number.isNaN(d.getTime())) {
    return new Date(Date.now() + DEFAULT_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  }
  return d.toISOString();
};

import { looksLikeGtin } from './merchantIdentifiers';
import { lookupZip } from './deliveryZip';

export const GOOGLE_MERCHANT_ID = 5791232179;
export const GCR_STORAGE_KEY = 'petshiwu_gcr_optin';
export const GCR_PLATFORM_SCRIPT_ID = 'google-customer-reviews-platform';
export const GCR_PLATFORM_SRC =
  'https://apis.google.com/js/platform.js?onload=renderOptIn';
export const GCR_LANGUAGE = 'en-US';
export const GCR_OPT_IN_STYLE = 'CENTER_DIALOG';

export type GoogleReviewProduct = { gtin: string };

export type GoogleReviewOptInConfig = {
  merchant_id: number;
  order_id: string;
  email: string;
  delivery_country: string;
  estimated_delivery_date: string;
  opt_in_style?: 'CENTER_DIALOG' | 'BOTTOM_RIGHT_DIALOG' | 'BOTTOM_LEFT_DIALOG' | 'TOP_RIGHT_DIALOG' | 'TOP_LEFT_DIALOG' | 'BOTTOM_TRAY';
  products?: GoogleReviewProduct[];
};

export type GoogleReviewOrder = {
  _id?: string;
  orderNumber?: string;
  orderStatus?: string;
  createdAt?: string;
  guestEmail?: string;
  user?: string | { email?: string } | null;
  shippingAddress?: {
    zipCode?: string;
    country?: string;
    state?: string;
  };
  items?: Array<{ variant?: { sku?: string } }>;
};

type StoredOptIn = {
  email?: string;
  orderNumber?: string;
  orderId?: string;
};

declare global {
  interface Window {
    renderOptIn?: () => void;
    ___gcfg?: { lang?: string };
    gapi?: {
      load: (module: string, callback: () => void) => void;
      surveyoptin?: {
        render: (config: GoogleReviewOptInConfig) => void;
      };
    };
  }
}

export function formatNyDateYmd(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function addCalendarDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day));
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function estimatedDeliveryDateYmd(zip: string | undefined, placedAt: Date): string {
  const placedYmd = formatNyDateYmd(placedAt);
  const result = zip ? lookupZip(zip, placedAt) : null;
  if (result?.speed === 'same-day') return placedYmd;
  if (result?.speed === 'next-day') return addCalendarDays(placedYmd, 1);
  return addCalendarDays(placedYmd, 2);
}

export function deliveryCountryCode(country?: string, state?: string): string {
  const value = String(country || '').trim().toUpperCase().replace(/\./g, '');
  if (!value || value === 'US' || value === 'USA' || value === 'UNITED STATES' || value === 'UNITED STATES OF AMERICA') {
    return 'US';
  }
  if (/^[A-Z]{2}$/.test(value)) return value;
  const stateValue = String(state || '').trim().toUpperCase();
  if (stateValue === 'NY' || stateValue === 'NEW YORK') return 'US';
  return 'US';
}

export function reviewProductGtins(items: GoogleReviewOrder['items']): GoogleReviewProduct[] {
  const seen = new Set<string>();
  const products: GoogleReviewProduct[] = [];
  for (const item of items || []) {
    const sku = String(item?.variant?.sku || '').trim();
    if (!looksLikeGtin(sku) || seen.has(sku)) continue;
    seen.add(sku);
    products.push({ gtin: sku });
  }
  return products;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function rememberGoogleReviewOptIn(payload: {
  email: string;
  orderNumber?: string;
  orderId?: string;
}): void {
  if (typeof sessionStorage === 'undefined') return;
  const email = payload.email.trim();
  if (!isValidEmail(email)) return;
  sessionStorage.setItem(GCR_STORAGE_KEY, JSON.stringify({
    email,
    orderNumber: payload.orderNumber,
    orderId: payload.orderId,
  }));
}

export function readGoogleReviewOptInEmail(orderNumber?: string, orderId?: string): string | undefined {
  if (typeof sessionStorage === 'undefined') return undefined;
  try {
    const raw = sessionStorage.getItem(GCR_STORAGE_KEY);
    if (!raw) return undefined;
    const saved = JSON.parse(raw) as StoredOptIn;
    const email = String(saved.email || '').trim();
    if (!isValidEmail(email)) return undefined;
    if (saved.orderNumber && orderNumber && saved.orderNumber !== orderNumber) return undefined;
    if (saved.orderId && orderId && saved.orderId !== String(orderId)) return undefined;
    return email;
  } catch {
    return undefined;
  }
}

export function resolveReviewEmail(
  order: GoogleReviewOrder,
  extras: { accountEmail?: string; explicitEmail?: string } = {}
): string | undefined {
  const candidates = [
    extras.explicitEmail,
    extras.accountEmail,
    order.guestEmail,
    typeof order.user === 'object' && order.user ? order.user.email : undefined,
    readGoogleReviewOptInEmail(order.orderNumber, order._id),
  ];
  for (const candidate of candidates) {
    const email = String(candidate || '').trim();
    if (isValidEmail(email)) return email;
  }
  return undefined;
}

export function buildSurveyOptInConfig(
  order: GoogleReviewOrder,
  email: string | undefined,
  placedAt: Date = order.createdAt ? new Date(order.createdAt) : new Date()
): GoogleReviewOptInConfig | null {
  const orderId = String(order.orderNumber || order._id || '').trim();
  const safeEmail = String(email || '').trim();
  if (!orderId || !isValidEmail(safeEmail)) return null;
  if (order.orderStatus === 'cancelled') return null;

  const config: GoogleReviewOptInConfig = {
    merchant_id: GOOGLE_MERCHANT_ID,
    order_id: orderId,
    email: safeEmail,
    delivery_country: deliveryCountryCode(
      order.shippingAddress?.country,
      order.shippingAddress?.state
    ),
    estimated_delivery_date: estimatedDeliveryDateYmd(order.shippingAddress?.zipCode, placedAt),
    opt_in_style: GCR_OPT_IN_STYLE,
  };

  const products = reviewProductGtins(order.items);
  if (products.length) config.products = products;
  return config;
}

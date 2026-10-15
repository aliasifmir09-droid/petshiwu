import { isAlaskaOrHawaiiAddress, isNycDeliveryZip, normalizeShippingState } from '@/utils/deliveryZip';

export const TOPDAWG_TAG = 'topdawg';

export const DELIVERY_ZONE = {
  SAME_DAY_NYC: 'SAME_DAY_NYC',
  TRI_STATE: 'TRI_STATE',
  NATIONWIDE: 'NATIONWIDE',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type DeliveryZoneId = (typeof DELIVERY_ZONE)[keyof typeof DELIVERY_ZONE];

/**
 * Locally stocked items ship nationwide. Alaska and Hawaii stay excluded
 * by the address gate. Point this at UNAVAILABLE to close the rest of the US again.
 */
export const LOCAL_OUTSIDE_TRISTATE_ZONE: DeliveryZoneId = DELIVERY_ZONE.NATIONWIDE;

/** One order fee for the whole US, including NYC. Change these two numbers in one place. */
export const SHIPPING_COST = 7;
export const FREE_SHIPPING_THRESHOLD = 49;
export const TRI_STATE_SHIPPING_COST = SHIPPING_COST;
export const TRI_STATE_FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD;
export const SAME_DAY_SHIPPING_COST = SHIPPING_COST;
export const SAME_DAY_FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD;
export const NATIONWIDE_SHIPPING_COST = SHIPPING_COST;

export const NATIONWIDE_WINDOW = 'Arrives in 3-5 business days';
export const NATIONWIDE_PAGE_PROMISE = 'Arrives in 3-5 business days anywhere in the US except Alaska and Hawaii';
export const NATIONWIDE_FEE_NOTE = '$7 delivery, free at $49+.';
export const TRI_STATE_WINDOW = NATIONWIDE_WINDOW;
export const TRI_STATE_PAGE_PROMISE = NATIONWIDE_PAGE_PROMISE;
export const TRI_STATE_FEE_NOTE = NATIONWIDE_FEE_NOTE;
export const LOCAL_UNAVAILABLE_MESSAGE = 'Not available for this address yet';
export const SAME_DAY_WINDOW = 'Same-day delivery in NYC';

/** Owner placeholder for the homepage H1. */
export const HERO_H1 = 'Fast delivery across America';
export const NATIONWIDE_BRAND_FRAME = 'Same-day NYC · nationwide delivery across the US';

export const MIXED_TRISTATE_DELIVERY_SUMMARY =
  'Items arrive in 3-5 business days. Same-day is only for locally stocked items in NYC.';

export const ZONE_FEES: Record<string, { cost: number; freeShippingThreshold: number | null }> = {
  [DELIVERY_ZONE.SAME_DAY_NYC]: { cost: SHIPPING_COST, freeShippingThreshold: FREE_SHIPPING_THRESHOLD },
  [DELIVERY_ZONE.TRI_STATE]: { cost: SHIPPING_COST, freeShippingThreshold: FREE_SHIPPING_THRESHOLD },
  [DELIVERY_ZONE.NATIONWIDE]: { cost: SHIPPING_COST, freeShippingThreshold: FREE_SHIPPING_THRESHOLD },
};

type LaneProduct = {
  tags?: readonly string[] | null;
  deliveryLane?: string;
  name?: string;
};

export function isTopDawgTags(tags?: readonly string[] | null): boolean {
  return Array.isArray(tags) && tags.some((tag) => String(tag).trim().toLowerCase() === TOPDAWG_TAG);
}

export function isNationwideProduct(product?: LaneProduct | null): boolean {
  if (!product) return false;
  if (Array.isArray(product.tags)) return isTopDawgTags(product.tags);
  return product.deliveryLane === 'nationwide';
}

export type DeliveryAddressInput = { state?: string; zipCode?: string };

/**
 * Zone for one product at an address.
 * Old catalog is same-day only for an NYC ZIP. TopDawg is never same-day.
 * Every other US address is nationwide. Alaska and Hawaii are unavailable.
 */
export function resolveDeliveryZone(
  stateOrAddress: string | DeliveryAddressInput | null | undefined,
  product?: LaneProduct | null
): DeliveryZoneId {
  const address: DeliveryAddressInput =
    typeof stateOrAddress === 'string' ? { state: stateOrAddress } : stateOrAddress || {};
  if (isAlaskaOrHawaiiAddress(address.state, address.zipCode)) return DELIVERY_ZONE.UNAVAILABLE;
  if (isNationwideProduct(product)) return DELIVERY_ZONE.NATIONWIDE;

  const stateCode = address.state ? normalizeShippingState(address.state) : '';
  const zip = String(address.zipCode || '').replace(/\D/g, '').slice(0, 5);
  const zipKnown = /^\d{5}$/.test(zip);
  const nycZip = zipKnown && isNycDeliveryZip(zip);

  if (nycZip && (stateCode === 'NY' || stateCode === '')) return DELIVERY_ZONE.SAME_DAY_NYC;
  if (!stateCode && !zipKnown) return DELIVERY_ZONE.SAME_DAY_NYC;
  return LOCAL_OUTSIDE_TRISTATE_ZONE;
}

export function zoneWindow(zone: DeliveryZoneId): string {
  switch (zone) {
    case DELIVERY_ZONE.SAME_DAY_NYC:
      return SAME_DAY_WINDOW;
    case DELIVERY_ZONE.NATIONWIDE:
    case DELIVERY_ZONE.TRI_STATE:
      return NATIONWIDE_WINDOW;
    default:
      return LOCAL_UNAVAILABLE_MESSAGE;
  }
}

/** One shipping charge for the order. $7 under $49, free at $49, including NYC and TopDawg. */
export function combineDeliveryFees(input: {
  zone: DeliveryZoneId;
  merchandiseSubtotal: number;
  hasNationwide: boolean;
  hasLocal: boolean;
  couponWaivesShipping?: boolean;
}): { localFee: number; nationwideFee: number; shippingPrice: number } {
  const waived =
    Boolean(input.couponWaivesShipping) || input.merchandiseSubtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingPrice = waived || input.zone === DELIVERY_ZONE.UNAVAILABLE ? 0 : SHIPPING_COST;
  return { localFee: shippingPrice, nationwideFee: 0, shippingPrice };
}

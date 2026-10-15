import { isNycDeliveryZip, normalizeShippingState } from './nycDelivery';

export const TOPDAWG_TAG = 'topdawg';

export const DELIVERY_ZONE = {
  SAME_DAY_NYC: 'SAME_DAY_NYC',
  TRI_STATE: 'TRI_STATE',
  NATIONWIDE: 'NATIONWIDE',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type DeliveryZoneId = (typeof DELIVERY_ZONE)[keyof typeof DELIVERY_ZONE];

/**
 * Phase 2 opens the rest of the US for locally stocked items by pointing this
 * at another key in ZONE_FEES. UNAVAILABLE refuses those addresses.
 */
export const LOCAL_OUTSIDE_TRISTATE_ZONE: DeliveryZoneId = DELIVERY_ZONE.UNAVAILABLE;

/** Owner-set tri-state delivery fee. Change this number in one place. */
export const TRI_STATE_SHIPPING_COST = 7;
export const TRI_STATE_FREE_SHIPPING_THRESHOLD = 49;
export const SAME_DAY_SHIPPING_COST = 6;
export const SAME_DAY_FREE_SHIPPING_THRESHOLD = 49;
export const NATIONWIDE_SHIPPING_COST = 7;

export const TRI_STATE_WINDOW = 'Delivered in 2-5 business days';
export const TRI_STATE_PAGE_PROMISE = 'Delivered in 2-5 business days across NY, NJ & CT';
export const NATIONWIDE_WINDOW = 'Arrives in 3-5 business days';
export const LOCAL_UNAVAILABLE_MESSAGE = 'Not available for this address yet';
export const SAME_DAY_WINDOW = 'Same-day delivery in NYC';

export const HERO_H1 = 'Fast delivery across America';
export const NATIONWIDE_BRAND_FRAME =
  'Same-day NYC · 2-5 days across NY, NJ & CT · nationwide on thousands of items';

export const MIXED_TRISTATE_DELIVERY_SUMMARY =
  'Local items are delivered in 2-5 business days, shipped items arrive separately in 3-5 business days.';

export const ZONE_FEES: Record<string, { cost: number; freeShippingThreshold: number | null }> = {
  [DELIVERY_ZONE.SAME_DAY_NYC]: { cost: SAME_DAY_SHIPPING_COST, freeShippingThreshold: SAME_DAY_FREE_SHIPPING_THRESHOLD },
  [DELIVERY_ZONE.TRI_STATE]: { cost: TRI_STATE_SHIPPING_COST, freeShippingThreshold: TRI_STATE_FREE_SHIPPING_THRESHOLD },
  [DELIVERY_ZONE.NATIONWIDE]: { cost: NATIONWIDE_SHIPPING_COST, freeShippingThreshold: null },
};

const TRI_STATE_ZIP_RANGES: Array<{ start: number; end: number }> = [
  { start: 6001, end: 6999 },
  { start: 7001, end: 8999 },
  { start: 10501, end: 10998 },
  { start: 11001, end: 11096 },
  { start: 11701, end: 11980 },
  { start: 12001, end: 14925 },
];

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

export function isTriStateZip(input?: string): boolean {
  const zip = String(input || '').replace(/\D/g, '').slice(0, 5);
  if (!/^\d{5}$/.test(zip)) return false;
  if (isNycDeliveryZip(zip)) return false;
  const zipNum = Number(zip);
  return TRI_STATE_ZIP_RANGES.some((range) => zipNum >= range.start && zipNum <= range.end);
}

export type DeliveryAddressInput = { state?: string; zipCode?: string };

export function resolveDeliveryZone(
  stateOrAddress: string | DeliveryAddressInput | null | undefined,
  product?: LaneProduct | null
): DeliveryZoneId {
  if (isNationwideProduct(product)) return DELIVERY_ZONE.NATIONWIDE;
  const address: DeliveryAddressInput =
    typeof stateOrAddress === 'string' ? { state: stateOrAddress } : stateOrAddress || {};
  const stateCode = address.state ? normalizeShippingState(address.state) : '';
  const zip = String(address.zipCode || '').replace(/\D/g, '').slice(0, 5);
  const zipKnown = /^\d{5}$/.test(zip);
  const nycZip = zipKnown && isNycDeliveryZip(zip);

  if (nycZip && (stateCode === 'NY' || stateCode === '')) return DELIVERY_ZONE.SAME_DAY_NYC;
  if (stateCode === 'NY' || stateCode === 'NJ' || stateCode === 'CT') return DELIVERY_ZONE.TRI_STATE;
  if (!stateCode && zipKnown && isTriStateZip(zip)) return DELIVERY_ZONE.TRI_STATE;
  if (!stateCode && !zipKnown) return DELIVERY_ZONE.SAME_DAY_NYC;
  return LOCAL_OUTSIDE_TRISTATE_ZONE;
}

export function zoneWindow(zone: DeliveryZoneId): string {
  switch (zone) {
    case DELIVERY_ZONE.SAME_DAY_NYC:
      return SAME_DAY_WINDOW;
    case DELIVERY_ZONE.TRI_STATE:
      return TRI_STATE_WINDOW;
    case DELIVERY_ZONE.NATIONWIDE:
      return NATIONWIDE_WINDOW;
    default:
      return LOCAL_UNAVAILABLE_MESSAGE;
  }
}

export function combineDeliveryFees(input: {
  zone: DeliveryZoneId;
  merchandiseSubtotal: number;
  hasNationwide: boolean;
  hasLocal: boolean;
  couponWaivesShipping?: boolean;
}): { localFee: number; nationwideFee: number; shippingPrice: number } {
  const nationwideFee = input.hasNationwide ? NATIONWIDE_SHIPPING_COST : 0;
  if (!input.hasLocal) {
    return { localFee: 0, nationwideFee, shippingPrice: nationwideFee };
  }
  const fee = ZONE_FEES[input.zone];
  if (!fee) {
    return { localFee: 0, nationwideFee, shippingPrice: nationwideFee };
  }
  const waived =
    fee.freeShippingThreshold != null &&
    (input.couponWaivesShipping || input.merchandiseSubtotal >= fee.freeShippingThreshold);
  const localFee = waived ? 0 : fee.cost;
  return {
    localFee,
    nationwideFee,
    shippingPrice: Number((localFee + nationwideFee).toFixed(2)),
  };
}

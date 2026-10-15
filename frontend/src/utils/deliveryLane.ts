import { isAlaskaOrHawaiiAddress, isNycDeliveryZip, isValidZip } from '@/utils/deliveryZip';
import {
  DELIVERY_ZONE,
  LOCAL_UNAVAILABLE_MESSAGE,
  NATIONWIDE_WINDOW,
  combineDeliveryFees,
  isNationwideProduct as zoneIsNationwideProduct,
  isTopDawgTags as zoneIsTopDawgTags,
  resolveDeliveryZone,
} from '@/utils/deliveryZones';

export {
  HERO_H1,
  LOCAL_UNAVAILABLE_MESSAGE,
  NATIONWIDE_BRAND_FRAME,
  TRI_STATE_FEE_NOTE,
  TRI_STATE_PAGE_PROMISE,
  TRI_STATE_SHIPPING_COST,
  TRI_STATE_WINDOW,
  resolveDeliveryZone,
} from '@/utils/deliveryZones';

export const TOPDAWG_TAG = 'topdawg';
export const NATIONWIDE_SHIPPING_COST = 7;
export const NATIONWIDE_PRODUCT_PROMISE = 'Ships nationwide - arrives in 3-5 business days';
/** TopDawg is never stocked locally, including for an NYC ZIP. */
export const TOPDAWG_NOT_SAME_DAY_PROMISE =
  'Not eligible for same-day delivery - ships nationwide, arrives in 3-5 business days ($7 under $49, free at $49+)';
export const MIXED_CART_DELIVERY_SUMMARY =
  'Same-day items deliver today, shipped items arrive separately in 3-5 business days.';
export const LOCAL_SAME_DAY_PROMISE = 'Same-day delivery in NYC';
export const LOCAL_ONLY_PROMISE = 'NYC same-day delivery only';
export const LOCAL_ITEM_NATIONWIDE_MESSAGE =
  'Some items in your cart are NYC same-day only and cannot ship nationwide. Remove those items or use a New York City address.';

export const INTERNATIONAL_DELIVERY_MESSAGE =
  'We ship inside the United States. Locally stocked items are same-day in NYC and arrive in 3-5 business days everywhere else. Does not ship to Alaska or Hawaii.';

export const EXCLUDED_SHIPPING_MESSAGE = 'Does not ship to Alaska or Hawaii.';

export { isAlaskaOrHawaiiAddress };

export type DeliveryLane = 'local' | 'nationwide';

type LaneProduct = {
  tags?: readonly string[] | null;
  deliveryLane?: DeliveryLane | string;
  name?: string;
};

export function isTopDawgTags(tags?: readonly string[] | null): boolean {
  return zoneIsTopDawgTags(tags);
}

export function isNationwideProduct(product?: LaneProduct | null): boolean {
  return zoneIsNationwideProduct(product);
}

export function isUnitedStatesCountry(country?: string): boolean {
  const value = String(country ?? 'USA')
    .trim()
    .toUpperCase()
    .replace(/\./g, '');
  if (!value) return true;
  return (
    value === 'US' ||
    value === 'USA' ||
    value === 'UNITED STATES' ||
    value === 'UNITED STATES OF AMERICA'
  );
}

export function productDeliveryPromise(
  product: LaneProduct | null | undefined,
  zip?: string | null,
  state?: string | null
): string {
  if (isNationwideProduct(product)) return TOPDAWG_NOT_SAME_DAY_PROMISE;
  const zone = resolveDeliveryZone({ state: state || undefined, zipCode: zip || undefined }, product);
  if (zone === DELIVERY_ZONE.UNAVAILABLE) {
    return isAlaskaOrHawaiiAddress(state || undefined, zip || undefined)
      ? EXCLUDED_SHIPPING_MESSAGE
      : LOCAL_UNAVAILABLE_MESSAGE;
  }
  if (zone === DELIVERY_ZONE.SAME_DAY_NYC) return LOCAL_SAME_DAY_PROMISE;
  return NATIONWIDE_WINDOW;
}

export function cartHasMixedLanes(items: Array<{ product?: LaneProduct | null }>): boolean {
  let nationwide = false;
  let local = false;
  for (const item of items) {
    if (isNationwideProduct(item?.product)) nationwide = true;
    else local = true;
  }
  return nationwide && local;
}

export function cartIsNationwideOnly(items: Array<{ product?: LaneProduct | null }>): boolean {
  return items.length > 0 && items.every((item) => isNationwideProduct(item?.product));
}

/** Cart-level promise. Null when every line is a local same-day item and no address says otherwise. */
export function cartDeliverySummary(
  items: Array<{ product?: LaneProduct | null }>,
  address?: { state?: string; zipCode?: string }
): string | null {
  const localZone = resolveDeliveryZone(address || {}, { tags: [] });
  if (localZone === DELIVERY_ZONE.UNAVAILABLE && (address?.zipCode || address?.state)) {
    return isAlaskaOrHawaiiAddress(address?.state, address?.zipCode)
      ? EXCLUDED_SHIPPING_MESSAGE
      : LOCAL_UNAVAILABLE_MESSAGE;
  }
  if (cartHasMixedLanes(items)) {
    return localZone === DELIVERY_ZONE.SAME_DAY_NYC ? MIXED_CART_DELIVERY_SUMMARY : NATIONWIDE_WINDOW;
  }
  if (cartIsNationwideOnly(items)) return TOPDAWG_NOT_SAME_DAY_PROMISE;
  if (localZone === DELIVERY_ZONE.NATIONWIDE) return NATIONWIDE_WINDOW;
  return null;
}

export function cartShipsNationwide(
  items: Array<{ product?: LaneProduct | null }>,
  address: { state?: string; zipCode?: string; country?: string }
): boolean {
  if (!items.length || items.some((item) => !isNationwideProduct(item.product))) return false;
  if (!isUnitedStatesCountry(address.country)) return false;
  if (isAlaskaOrHawaiiAddress(address.state, address.zipCode)) return false;
  return Boolean(address.zipCode && isValidZip(address.zipCode) && !isNycDeliveryZip(address.zipCode));
}

/** Local items only fail this gate outside the United States. Alaska and Hawaii use the exclusion message. */
export function localItemsBlockedOutsideNyc(
  items: Array<{ product?: LaneProduct | null }>,
  address: { state?: string; zipCode?: string; country?: string }
): boolean {
  if (!items.some((item) => !isNationwideProduct(item.product))) return false;
  if (address.country && !isUnitedStatesCountry(address.country)) return true;
  return false;
}

export function isCartDeliverable(
  items: Array<{ product?: LaneProduct | null }>,
  address: { state?: string; zipCode?: string; country?: string }
): boolean {
  if (!isUnitedStatesCountry(address.country)) return false;
  if (isAlaskaOrHawaiiAddress(address.state, address.zipCode)) return false;
  if (!address.zipCode || !isValidZip(address.zipCode)) return false;
  return true;
}

export function quoteStorefrontDelivery(input: {
  state?: string;
  zipCode?: string;
  country?: string;
  items: Array<{ product?: LaneProduct | null; price?: number; quantity?: number; tags?: readonly string[] | null; name?: string }>;
  couponWaivesShipping?: boolean;
}): { ok: true; shippingPrice: number; localFee: number; nationwideFee: number } | { ok: false; message: string } {
  if (input.country && !isUnitedStatesCountry(input.country)) {
    return { ok: false, message: INTERNATIONAL_DELIVERY_MESSAGE };
  }
  if (isAlaskaOrHawaiiAddress(input.state, input.zipCode)) {
    return { ok: false, message: EXCLUDED_SHIPPING_MESSAGE };
  }
  const laneItems = input.items.map((item) => item.product || item);
  const hasNationwide = laneItems.some((item) => isNationwideProduct(item));
  const hasLocal = laneItems.some((item) => !isNationwideProduct(item));
  const zone = resolveDeliveryZone({ state: input.state, zipCode: input.zipCode }, hasLocal ? { tags: [] } : { tags: ['topdawg'] });
  if (zone === DELIVERY_ZONE.UNAVAILABLE) {
    return { ok: false, message: EXCLUDED_SHIPPING_MESSAGE };
  }
  const merchandiseSubtotal = Number(
    input.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0).toFixed(2)
  );
  const fees = combineDeliveryFees({
    zone: hasLocal ? zone : DELIVERY_ZONE.NATIONWIDE,
    merchandiseSubtotal,
    hasNationwide,
    hasLocal,
    couponWaivesShipping: input.couponWaivesShipping,
  });
  return { ok: true, ...fees };
}

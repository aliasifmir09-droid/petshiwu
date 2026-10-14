import { isNycDeliveryZip, isValidZip } from '@/utils/deliveryZip';

export const TOPDAWG_TAG = 'topdawg';
export const NATIONWIDE_SHIPPING_COST = 7;
export const NATIONWIDE_PRODUCT_PROMISE = 'Ships nationwide - arrives in 3-5 business days';
/** TopDawg is never stocked locally, including for an NYC ZIP. */
export const TOPDAWG_NOT_SAME_DAY_PROMISE =
  'Not eligible for same-day delivery - ships nationwide, arrives in 3-5 business days (flat $7)';
export const MIXED_CART_DELIVERY_SUMMARY =
  'Same-day items deliver today, shipped items arrive separately in 3-5 business days.';
export const LOCAL_SAME_DAY_PROMISE = 'Same-day delivery in NYC';
export const LOCAL_ONLY_PROMISE = 'NYC same-day delivery only';
export const LOCAL_ITEM_NATIONWIDE_MESSAGE =
  'Some items in your cart are NYC same-day only and cannot ship nationwide. Remove those items or use a New York City address.';

export const INTERNATIONAL_DELIVERY_MESSAGE =
  'We ship inside the United States. Local items are NYC same-day only. Shipped items arrive in 3-5 business days.';

export type DeliveryLane = 'local' | 'nationwide';

type LaneProduct = {
  tags?: readonly string[] | null;
  deliveryLane?: DeliveryLane | string;
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

export function productDeliveryPromise(product: LaneProduct | null | undefined, zip?: string | null): string {
  if (isNationwideProduct(product)) return TOPDAWG_NOT_SAME_DAY_PROMISE;
  if (zip && isValidZip(zip) && !isNycDeliveryZip(zip)) return LOCAL_ONLY_PROMISE;
  return LOCAL_SAME_DAY_PROMISE;
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

/** Cart-level promise. Null when every line is a local same-day item. */
export function cartDeliverySummary(items: Array<{ product?: LaneProduct | null }>): string | null {
  if (cartHasMixedLanes(items)) return MIXED_CART_DELIVERY_SUMMARY;
  if (cartIsNationwideOnly(items)) return TOPDAWG_NOT_SAME_DAY_PROMISE;
  return null;
}

export function cartShipsNationwide(
  items: Array<{ product?: LaneProduct | null }>,
  address: { state?: string; zipCode?: string; country?: string }
): boolean {
  if (!items.length || items.some((item) => !isNationwideProduct(item.product))) return false;
  if (!isUnitedStatesCountry(address.country)) return false;
  return Boolean(address.zipCode && isValidZip(address.zipCode) && !isNycDeliveryZip(address.zipCode));
}

export function localItemsBlockedOutsideNyc(
  items: Array<{ product?: LaneProduct | null }>,
  address: { state?: string; zipCode?: string; country?: string }
): boolean {
  if (!address.zipCode || !isValidZip(address.zipCode)) return false;
  if (isNycDeliveryZip(address.zipCode) && isUnitedStatesCountry(address.country)) return false;
  return items.some((item) => !isNationwideProduct(item.product));
}

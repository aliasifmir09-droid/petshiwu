import { isNycDeliveryZip, isValidZip } from '@/utils/deliveryZip';

export const TOPDAWG_TAG = 'topdawg';
export const NATIONWIDE_SHIPPING_COST = 7;
export const NATIONWIDE_PRODUCT_PROMISE = 'Ships nationwide - arrives in 3-5 business days';
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
  if (isNationwideProduct(product)) return NATIONWIDE_PRODUCT_PROMISE;
  if (zip && isValidZip(zip) && !isNycDeliveryZip(zip)) return LOCAL_ONLY_PROMISE;
  return LOCAL_SAME_DAY_PROMISE;
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

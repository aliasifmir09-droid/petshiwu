import { isNycShippingAddress } from './nycDelivery';

export const TOPDAWG_TAG = 'topdawg';
export const NATIONWIDE_SHIPPING_COST = 7;
export type DeliveryLane = 'local' | 'nationwide';
export type ShippingLane = 'nyc' | 'nationwide';

export const LOCAL_ITEM_NATIONWIDE_MESSAGE =
  'Some items in your cart are NYC same-day only and cannot ship nationwide. Remove those items or use a New York City address.';

export const INTERNATIONAL_DELIVERY_MESSAGE =
  'We ship inside the United States. Local items are NYC same-day only. Shipped items arrive in 3-5 business days.';

export const EXCLUDED_SHIPPING_MESSAGE = 'Does not ship to Alaska or Hawaii.';

/** Alaska 99501–99950 and Hawaii 96701–96898. */
export function isAlaskaOrHawaiiAddress(state?: string, zipCode?: string): boolean {
  const normalized = String(state || '')
    .trim()
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
  if (normalized === 'AK' || normalized === 'ALASKA' || normalized === 'HI' || normalized === 'HAWAII') {
    return true;
  }
  const zip = String(zipCode || '').replace(/\D/g, '').slice(0, 5);
  if (!/^\d{5}$/.test(zip)) return false;
  const zipNum = Number(zip);
  return (zipNum >= 99501 && zipNum <= 99950) || (zipNum >= 96701 && zipNum <= 96898);
}

export class DeliveryAreaError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'DeliveryAreaError';
  }
}

export function isTopDawgTags(tags?: readonly string[] | null): boolean {
  return Array.isArray(tags) && tags.some((tag) => String(tag).trim().toLowerCase() === TOPDAWG_TAG);
}

export function deliveryLaneFromTags(tags?: readonly string[] | null): DeliveryLane {
  return isTopDawgTags(tags) ? 'nationwide' : 'local';
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

export function shippingLaneForCart(input: {
  state?: string;
  zipCode?: string;
  country?: string;
  items: Array<{ tags?: readonly string[] | null; name?: string }>;
}): ShippingLane {
  if (!isUnitedStatesCountry(input.country)) {
    throw new DeliveryAreaError(INTERNATIONAL_DELIVERY_MESSAGE);
  }
  if (isAlaskaOrHawaiiAddress(input.state, input.zipCode)) {
    throw new DeliveryAreaError(EXCLUDED_SHIPPING_MESSAGE);
  }
  if (isNycShippingAddress(input.state || '', input.zipCode || '')) {
    return 'nyc';
  }
  const localItems = input.items.filter((item) => !isTopDawgTags(item.tags));
  if (input.items.length === 0 || localItems.length > 0) {
    const names = localItems.map((item) => item.name).filter(Boolean).slice(0, 3) as string[];
    const named = names.length
      ? `${names.join(', ')} ${names.length === 1 ? 'is' : 'are'} NYC same-day only. `
      : '';
    throw new DeliveryAreaError(`${named}${LOCAL_ITEM_NATIONWIDE_MESSAGE}`);
  }
  return 'nationwide';
}

export function shippingPriceForLane(
  itemsPrice: number,
  lane: ShippingLane,
  options: { freeByThreshold: boolean; couponWaivesShipping: boolean }
): number {
  if (lane === 'nationwide') return NATIONWIDE_SHIPPING_COST;
  if (options.couponWaivesShipping || options.freeByThreshold) return 0;
  return 6;
}

/** Gate used by both order-creation paths. 200 means the address can take this cart. */
export function quoteCartDelivery(input: {
  state?: string;
  zipCode?: string;
  country?: string;
  items: Array<{ tags?: readonly string[] | null; name?: string; price: number; quantity: number }>;
  couponWaivesShipping?: boolean;
}): { status: 200; shippingPrice: number; lane: ShippingLane } | { status: 400; message: string } {
  try {
    const lane = shippingLaneForCart(input);
    const itemsPrice = Number(
      input.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(2)
    );
    return {
      status: 200,
      lane,
      shippingPrice: shippingPriceForLane(itemsPrice, lane, {
        freeByThreshold: itemsPrice >= 49,
        couponWaivesShipping: Boolean(input.couponWaivesShipping),
      }),
    };
  } catch (error) {
    if (error instanceof DeliveryAreaError) return { status: 400, message: error.message };
    throw error;
  }
}

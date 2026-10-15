import { isNycShippingAddress } from './nycDelivery';
import {
  DELIVERY_ZONE,
  LOCAL_UNAVAILABLE_MESSAGE,
  NATIONWIDE_SHIPPING_COST,
  combineDeliveryFees,
  isTopDawgTags as zoneIsTopDawgTags,
  resolveDeliveryZone,
} from './deliveryZones';

export const TOPDAWG_TAG = 'topdawg';
export { NATIONWIDE_SHIPPING_COST };
export type DeliveryLane = 'local' | 'nationwide';
export type ShippingLane = 'nyc' | 'tri_state' | 'nationwide';

export const LOCAL_ITEM_NATIONWIDE_MESSAGE = LOCAL_UNAVAILABLE_MESSAGE;

export const INTERNATIONAL_DELIVERY_MESSAGE =
  'We ship inside the United States. Local items deliver same-day in NYC or in 2-5 business days across NY, NJ, and CT. Shipped items arrive in 3-5 business days.';

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
  return zoneIsTopDawgTags(tags);
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
  const localItems = input.items.filter((item) => !isTopDawgTags(item.tags));
  if (localItems.length === 0 && input.items.length > 0) return 'nationwide';
  const zone = resolveDeliveryZone(input, { tags: [] });
  if (zone === DELIVERY_ZONE.SAME_DAY_NYC && isNycShippingAddress(input.state || '', input.zipCode || '')) {
    return 'nyc';
  }
  if (zone === DELIVERY_ZONE.TRI_STATE) return 'tri_state';
  if (zone === DELIVERY_ZONE.SAME_DAY_NYC) return 'nyc';
  const names = localItems.map((item) => item.name).filter(Boolean).slice(0, 3) as string[];
  const named = names.length ? `${names.join(', ')}: ` : '';
  throw new DeliveryAreaError(`${named}${LOCAL_UNAVAILABLE_MESSAGE}`);
}

export function shippingPriceForLane(
  itemsPrice: number,
  lane: ShippingLane,
  options: { freeByThreshold: boolean; couponWaivesShipping: boolean; hasNationwide?: boolean }
): number {
  const hasNationwide = options.hasNationwide ?? lane === 'nationwide';
  const hasLocal = lane !== 'nationwide';
  const zone =
    lane === 'tri_state' ? DELIVERY_ZONE.TRI_STATE : lane === 'nationwide' ? DELIVERY_ZONE.NATIONWIDE : DELIVERY_ZONE.SAME_DAY_NYC;
  return combineDeliveryFees({
    zone,
    merchandiseSubtotal: itemsPrice,
    hasNationwide,
    hasLocal,
    couponWaivesShipping: options.couponWaivesShipping,
  }).shippingPrice;
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
    const hasNationwide = input.items.some((item) => isTopDawgTags(item.tags));
    return {
      status: 200,
      lane,
      shippingPrice: shippingPriceForLane(itemsPrice, lane, {
        freeByThreshold: itemsPrice >= 49,
        couponWaivesShipping: Boolean(input.couponWaivesShipping),
        hasNationwide,
      }),
    };
  } catch (error) {
    if (error instanceof DeliveryAreaError) return { status: 400, message: error.message };
    throw error;
  }
}

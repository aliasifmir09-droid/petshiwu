import { isAlaskaOrHawaiiAddress, isNycShippingAddress } from './nycDelivery';
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
  'We ship inside the United States. Locally stocked items are same-day in NYC and arrive in 2-5 business days everywhere else. Does not ship to Alaska or Hawaii.';

export const EXCLUDED_SHIPPING_MESSAGE = 'Does not ship to Alaska or Hawaii.';

export { isAlaskaOrHawaiiAddress };

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
  if (input.items.length > 0 && input.items.every((item) => isTopDawgTags(item.tags))) return 'nationwide';
  const zone = resolveDeliveryZone(input, { tags: [] });
  if (zone === DELIVERY_ZONE.UNAVAILABLE) {
    throw new DeliveryAreaError(EXCLUDED_SHIPPING_MESSAGE);
  }
  if (zone === DELIVERY_ZONE.SAME_DAY_NYC && isNycShippingAddress(input.state || '', input.zipCode || '')) {
    return 'nyc';
  }
  if (zone === DELIVERY_ZONE.SAME_DAY_NYC) return 'nyc';
  return 'nationwide';
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

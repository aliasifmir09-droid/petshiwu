import { isDeliverableShippingAddress, isValidZip, OUT_OF_AREA_DELIVERY_MESSAGE } from '@/utils/deliveryZip';
import {
  INTERNATIONAL_DELIVERY_MESSAGE,
  cartShipsNationwide,
  isUnitedStatesCountry,
  localItemsBlockedOutsideNyc,
  type DeliveryLane,
} from '@/utils/deliveryLane';

type LaneItem = { tags?: string[]; deliveryLane?: DeliveryLane | string; name?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PayPalCheckoutShipping = {
  firstName?: string;
  lastName?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  country?: string;
};

/** Fail PayPal/Apple/Google/card start in the browser with a shopper-facing reason. */
export const paypalCheckoutBlocker = ({
  shippingAddress,
  guestEmail,
  items,
}: {
  shippingAddress: PayPalCheckoutShipping;
  guestEmail?: string;
  items?: Array<{ product?: LaneItem | null } | LaneItem>;
}): string | null => {
  if (guestEmail !== undefined && (!guestEmail.trim() || !EMAIL_PATTERN.test(guestEmail.trim()))) {
    return 'Please enter a valid email address to continue with PayPal.';
  }
  if (
    !shippingAddress.firstName?.trim() ||
    !shippingAddress.lastName?.trim() ||
    !shippingAddress.street?.trim() ||
    !shippingAddress.city?.trim() ||
    !shippingAddress.state?.trim() ||
    !shippingAddress.phone?.trim() ||
    !isValidZip(shippingAddress.zipCode || '')
  ) {
    return 'Please complete your delivery address before paying.';
  }
  const country = shippingAddress.country || 'USA';
  if (!isUnitedStatesCountry(country)) return INTERNATIONAL_DELIVERY_MESSAGE;
  const laneItems = (items && items.length ? items : [{ tags: [] }]).map((item) =>
    item && 'product' in item ? { product: item.product } : { product: item as LaneItem }
  );
  const address = {
    state: shippingAddress.state,
    zipCode: shippingAddress.zipCode,
    country,
  };
  if (cartShipsNationwide(laneItems, address)) return null;
  if (
    !isDeliverableShippingAddress(shippingAddress.state, shippingAddress.zipCode || '') ||
    localItemsBlockedOutsideNyc(laneItems, address)
  ) {
    return OUT_OF_AREA_DELIVERY_MESSAGE;
  }
  return null;
};

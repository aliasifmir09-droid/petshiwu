import { isDeliverableShippingAddress, isValidZip } from '@/utils/deliveryZip';
import {
  cartShipsNationwide,
  isUnitedStatesCountry,
  localItemsBlockedOutsideNyc,
} from '@/utils/deliveryLane';

type CheckoutCartItem = {
  product?: { tags?: string[]; deliveryLane?: string; name?: string } | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CheckoutShippingFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
};

export const isCheckoutDeliveryReady = (
  shipping: CheckoutShippingFields,
  isAuthenticated: boolean,
  items: CheckoutCartItem[] = [{ product: { tags: [] } }]
): boolean => {
  if (!shipping.firstName?.trim() || !shipping.lastName?.trim()) return false;
  if (!shipping.phone?.trim()) return false;
  if (
    !shipping.street?.trim() ||
    !shipping.city?.trim() ||
    !shipping.state?.trim() ||
    !shipping.zipCode?.trim()
  ) {
    return false;
  }
  if (!isValidZip(shipping.zipCode)) return false;
  const address = { state: shipping.state, zipCode: shipping.zipCode, country: 'USA' };
  const nyc = isDeliverableShippingAddress(shipping.state, shipping.zipCode);
  const nationwide = cartShipsNationwide(items, address);
  if (!nyc && !nationwide) return false;
  if (localItemsBlockedOutsideNyc(items, address)) return false;
  if (!isUnitedStatesCountry(address.country)) return false;
  if (!isAuthenticated && !EMAIL_PATTERN.test(shipping.email?.trim() || '')) return false;
  return true;
};

/** Keep checkout mounted after pay (cart is cleared) and while localStorage hydrates. */
export const shouldHoldCheckoutOnEmptyCart = ({
  hydrated,
  placingOrder,
  itemCount,
}: {
  hydrated: boolean;
  placingOrder: boolean;
  itemCount: number;
}): boolean => !hydrated || placingOrder || itemCount > 0;

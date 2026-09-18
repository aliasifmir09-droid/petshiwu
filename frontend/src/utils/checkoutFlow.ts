import { isNewYorkState, isNycDeliveryZip } from '@/utils/deliveryZip';

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
  isAuthenticated: boolean
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
  if (!isNewYorkState(shipping.state) || !isNycDeliveryZip(shipping.zipCode)) return false;
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

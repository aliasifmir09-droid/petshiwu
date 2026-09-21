import { isDeliverableShippingAddress, isValidZip, OUT_OF_AREA_DELIVERY_MESSAGE } from '@/utils/deliveryZip';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PayPalCheckoutShipping = {
  firstName?: string;
  lastName?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
};

/** Fail PayPal/Apple/Google/card start in the browser with a shopper-facing reason. */
export const paypalCheckoutBlocker = ({
  shippingAddress,
  guestEmail,
}: {
  shippingAddress: PayPalCheckoutShipping;
  guestEmail?: string;
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
  if (!isDeliverableShippingAddress(shippingAddress.state, shippingAddress.zipCode || '')) {
    return OUT_OF_AREA_DELIVERY_MESSAGE;
  }
  return null;
};

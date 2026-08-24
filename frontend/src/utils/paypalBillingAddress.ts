import type { ShippingAddress } from '@/types';
import type { PayPalCardFieldsBillingAddress } from '@paypal/paypal-js';

/** PayPal Card Fields require ISO 3166-1 alpha-2 country codes, not "USA". */
export function toPayPalCountryCode(country: string | undefined): string {
  const normalized = String(country || '')
    .trim()
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');

  if (
    normalized === 'US' ||
    normalized === 'USA' ||
    normalized === 'UNITED STATES' ||
    normalized === 'UNITED STATES OF AMERICA'
  ) {
    return 'US';
  }

  if (normalized === 'CA' || normalized === 'CAN' || normalized === 'CANADA') {
    return 'CA';
  }

  if (/^[A-Z]{2}$/.test(normalized)) {
    return normalized;
  }

  return 'US';
}

export function toPayPalCardholderName(address: Pick<ShippingAddress, 'firstName' | 'lastName'>): string {
  return [address.firstName, address.lastName].filter(Boolean).join(' ').trim();
}

export function toPayPalCardBillingAddress(
  address: Pick<ShippingAddress, 'street' | 'city' | 'state' | 'zipCode' | 'country'>
): PayPalCardFieldsBillingAddress {
  return {
    addressLine1: address.street?.trim() || undefined,
    adminArea2: address.city?.trim() || undefined,
    adminArea1: address.state?.trim() || undefined,
    postalCode: address.zipCode?.trim() || undefined,
    countryCode: toPayPalCountryCode(address.country)
  };
}

import { describe, expect, test } from 'vitest';
import {
  formatCardExpiry,
  isReusableSavedCard,
  pickDefaultSavedAddress,
  pickDefaultSavedCard,
  savedAddressLine,
  savedCardLabel,
} from '../savedCheckout';

describe('saved checkout helpers', () => {
  test('picks the default reusable card and skips wallet rows without last4', () => {
    const picked = pickDefaultSavedCard([
      { _id: 'paypal', type: 'paypal', isDefault: true },
      { _id: 'visa', type: 'credit_card', last4: '4242', brand: 'visa', isDefault: false },
      { _id: 'mc', type: 'credit_card', last4: '4444', brand: 'mastercard', isDefault: true },
    ]);
    expect(picked?._id).toBe('mc');
    expect(savedCardLabel(picked!)).toBe('Mastercard •••• 4444');
    expect(isReusableSavedCard({ _id: 'empty', type: 'apple_pay' })).toBe(false);
  });

  test('formats a saved address and expiry for checkout reuse copy', () => {
    const address = pickDefaultSavedAddress([
      { street: '37-68 74th St', city: 'Queens', state: 'NY', zipCode: '11372' },
      {
        street: '1 Main St',
        city: 'Astoria',
        state: 'NY',
        zipCode: '11106',
        isDefault: true,
      },
    ]);
    expect(savedAddressLine(address!)).toBe('1 Main St, Astoria, NY 11106');
    expect(formatCardExpiry({ _id: 'visa', last4: '4242', expiryMonth: 4, expiryYear: 2028 })).toBe('04/28');
  });
});

import { describe, expect, test } from 'vitest';
import { OUT_OF_AREA_DELIVERY_MESSAGE } from '@/utils/deliveryZip';
import { paypalCheckoutBlocker } from '@/utils/paypalCheckoutReady';

const nyc = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  street: '37-68 74th St',
  city: 'Jackson Heights',
  state: 'NY',
  zipCode: '11372',
  phone: '3475550100',
};

describe('paypalCheckoutBlocker', () => {
  test('lets a complete NYC guest checkout through', () => {
    expect(paypalCheckoutBlocker({ shippingAddress: nyc, guestEmail: 'ada@example.com' })).toBeNull();
  });

  test('asks for email before calling PayPal', () => {
    expect(paypalCheckoutBlocker({ shippingAddress: nyc, guestEmail: '' })).toMatch(/email/i);
  });

  test('asks for a complete address before calling PayPal', () => {
    expect(
      paypalCheckoutBlocker({
        shippingAddress: { ...nyc, street: '' },
        guestEmail: 'ada@example.com',
      })
    ).toMatch(/delivery address/i);
  });

  test('blocks ZIPs outside NYC and the 50-mile zone', () => {
    expect(
      paypalCheckoutBlocker({
        shippingAddress: { ...nyc, city: 'San Francisco', state: 'CA', zipCode: '94105' },
        guestEmail: 'ada@example.com',
      })
    ).toBe(OUT_OF_AREA_DELIVERY_MESSAGE);
  });
});

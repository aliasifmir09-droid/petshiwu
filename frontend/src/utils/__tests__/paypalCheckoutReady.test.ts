import { describe, expect, test } from 'vitest';
import { EXCLUDED_SHIPPING_MESSAGE } from '@/utils/deliveryLane';
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

  test('blocks local carts outside NY, NJ, and CT and allows tri-state', () => {
    expect(
      paypalCheckoutBlocker({
        shippingAddress: { ...nyc, city: 'Los Angeles', state: 'CA', zipCode: '90001' },
        guestEmail: 'ada@example.com',
      })
    ).toBe(OUT_OF_AREA_DELIVERY_MESSAGE);
    expect(
      paypalCheckoutBlocker({
        shippingAddress: { ...nyc, city: 'Hoboken', state: 'NJ', zipCode: '07030' },
        guestEmail: 'ada@example.com',
      })
    ).toBeNull();
    expect(
      paypalCheckoutBlocker({
        shippingAddress: { ...nyc, city: 'Hicksville', state: 'NY', zipCode: '11801' },
        guestEmail: 'ada@example.com',
      })
    ).toBeNull();
  });

  test('lets an all-TopDawg cart ship to a non-NYC address', () => {
    expect(
      paypalCheckoutBlocker({
        shippingAddress: { ...nyc, city: 'Hoboken', state: 'NJ', zipCode: '07030' },
        guestEmail: 'ada@example.com',
        items: [{ product: { tags: ['topdawg'] } }],
      })
    ).toBeNull();
    expect(
      paypalCheckoutBlocker({
        shippingAddress: { ...nyc, city: 'Anchorage', state: 'AK', zipCode: '99501' },
        guestEmail: 'ada@example.com',
        items: [{ product: { tags: ['topdawg'] } }],
      })
    ).toBe(EXCLUDED_SHIPPING_MESSAGE);
    expect(
      paypalCheckoutBlocker({
        shippingAddress: { ...nyc, city: 'Honolulu', state: 'HI', zipCode: '96813' },
        guestEmail: 'ada@example.com',
        items: [{ product: { tags: ['topdawg'] } }],
      })
    ).toBe(EXCLUDED_SHIPPING_MESSAGE);
  });
});

import { describe, expect, test } from 'vitest';
import { isCheckoutDeliveryReady, shouldHoldCheckoutOnEmptyCart } from '../checkoutFlow';

const nycAddress = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '3475550100',
  street: '37-68 74th St',
  city: 'Jackson Heights',
  state: 'NY',
  zipCode: '11372',
};

describe('checkoutFlow', () => {
  test('guest checkout needs a valid NYC address and email before PayPal unlocks', () => {
    expect(isCheckoutDeliveryReady(nycAddress, false)).toBe(true);
    expect(isCheckoutDeliveryReady({ ...nycAddress, email: '' }, false)).toBe(false);
    expect(isCheckoutDeliveryReady({ ...nycAddress, zipCode: '07030' }, false)).toBe(false);
    expect(isCheckoutDeliveryReady({ ...nycAddress, street: '' }, true)).toBe(false);
  });

  test('50-mile metro ZIPs unlock checkout; far ZIPs stay blocked', () => {
    expect(
      isCheckoutDeliveryReady(
        { ...nycAddress, city: 'Hicksville', zipCode: '11801' },
        false
      )
    ).toBe(true);
    expect(
      isCheckoutDeliveryReady(
        { ...nycAddress, city: 'Jamaica', zipCode: '11432' },
        false
      )
    ).toBe(true);
    expect(
      isCheckoutDeliveryReady(
        { ...nycAddress, city: 'Hoboken', state: 'NJ', zipCode: '07030' },
        false
      )
    ).toBe(true);
    expect(
      isCheckoutDeliveryReady(
        { ...nycAddress, city: 'Greenwich', state: 'CT', zipCode: '06830' },
        false
      )
    ).toBe(true);
    expect(
      isCheckoutDeliveryReady(
        { ...nycAddress, city: 'New Haven', state: 'CT', zipCode: '06511' },
        false
      )
    ).toBe(false);
    expect(isCheckoutDeliveryReady({ ...nycAddress, zipCode: '94105' }, false)).toBe(false);
  });

  test('logged-in shoppers can skip email on the form', () => {
    expect(isCheckoutDeliveryReady({ ...nycAddress, email: '' }, true)).toBe(true);
  });

  test('does not bounce to an empty cart while hydrating or after payment', () => {
    expect(shouldHoldCheckoutOnEmptyCart({ hydrated: false, placingOrder: false, itemCount: 0 })).toBe(true);
    expect(shouldHoldCheckoutOnEmptyCart({ hydrated: true, placingOrder: true, itemCount: 0 })).toBe(true);
    expect(shouldHoldCheckoutOnEmptyCart({ hydrated: true, placingOrder: false, itemCount: 1 })).toBe(true);
    expect(shouldHoldCheckoutOnEmptyCart({ hydrated: true, placingOrder: false, itemCount: 0 })).toBe(false);
  });
});

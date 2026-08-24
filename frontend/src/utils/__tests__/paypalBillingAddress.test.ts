import { describe, expect, test } from 'vitest';
import {
  toPayPalCardBillingAddress,
  toPayPalCardholderName,
  toPayPalCountryCode
} from '../paypalBillingAddress';

describe('PayPal Card Fields billing address', () => {
  test('maps USA and full country names to ISO US', () => {
    expect(toPayPalCountryCode('USA')).toBe('US');
    expect(toPayPalCountryCode('United States')).toBe('US');
    expect(toPayPalCountryCode('united states of america')).toBe('US');
    expect(toPayPalCountryCode('us')).toBe('US');
    expect(toPayPalCountryCode('')).toBe('US');
  });

  test('keeps other ISO country codes', () => {
    expect(toPayPalCountryCode('GB')).toBe('GB');
    expect(toPayPalCountryCode('CA')).toBe('CA');
    expect(toPayPalCountryCode('Canada')).toBe('CA');
  });

  test('builds Card Fields submit billing address from checkout shipping', () => {
    expect(toPayPalCardholderName({ firstName: 'Mujahid', lastName: 'Hussain' })).toBe('Mujahid Hussain');
    expect(toPayPalCardBillingAddress({
      street: '123 Atlantic Ave',
      city: 'Brooklyn',
      state: 'NY',
      zipCode: '11201',
      country: 'USA'
    })).toEqual({
      addressLine1: '123 Atlantic Ave',
      adminArea2: 'Brooklyn',
      adminArea1: 'NY',
      postalCode: '11201',
      countryCode: 'US'
    });
  });
});

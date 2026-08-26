import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  GOOGLE_MERCHANT_ID,
  addCalendarDays,
  buildSurveyOptInConfig,
  deliveryCountryCode,
  estimatedDeliveryDateYmd,
  formatNyDateYmd,
  rememberGoogleReviewOptIn,
  resolveReviewEmail,
  reviewProductGtins,
} from '../googleCustomerReviews';

describe('googleCustomerReviews', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('formats New York calendar dates as YYYY-MM-DD', () => {
    expect(formatNyDateYmd(new Date('2026-08-13T14:00:00Z'))).toBe('2026-08-13');
    expect(addCalendarDays('2026-08-13', 1)).toBe('2026-08-14');
    expect(addCalendarDays('2026-08-31', 1)).toBe('2026-09-01');
  });

  test('estimates same-day, next-day, and nationwide delivery dates', () => {
    const morning = new Date('2026-08-13T14:00:00Z');
    const evening = new Date('2026-08-13T20:30:00Z');
    expect(estimatedDeliveryDateYmd('11372', morning)).toBe('2026-08-13');
    expect(estimatedDeliveryDateYmd('10001', evening)).toBe('2026-08-14');
    expect(estimatedDeliveryDateYmd('94105', morning)).toBe('2026-08-15');
  });

  test('maps USA-style country names to US', () => {
    expect(deliveryCountryCode('USA', 'NY')).toBe('US');
    expect(deliveryCountryCode('United States', 'New York')).toBe('US');
    expect(deliveryCountryCode('us')).toBe('US');
    expect(deliveryCountryCode(undefined, 'NY')).toBe('US');
  });

  test('includes only GTIN-shaped SKUs', () => {
    expect(reviewProductGtins([
      { variant: { sku: '012345678905' } },
      { variant: { sku: 'HILLS-KD' } },
      { variant: { sku: '012345678905' } },
    ])).toEqual([{ gtin: '012345678905' }]);
  });

  test('builds the Merchant Center opt-in payload for a NYC order', () => {
    const config = buildSurveyOptInConfig(
      {
        orderNumber: 'ORD-123',
        createdAt: '2026-08-13T14:00:00.000Z',
        shippingAddress: { zipCode: '11372', country: 'USA', state: 'NY' },
        items: [{ variant: { sku: '012345678905' } }],
      },
      'family@example.com',
      new Date('2026-08-13T14:00:00Z')
    );

    expect(config).toEqual({
      merchant_id: GOOGLE_MERCHANT_ID,
      order_id: 'ORD-123',
      email: 'family@example.com',
      delivery_country: 'US',
      estimated_delivery_date: '2026-08-13',
      products: [{ gtin: '012345678905' }],
    });
  });

  test('skips cancelled orders and invalid emails', () => {
    expect(buildSurveyOptInConfig({ orderNumber: 'ORD-1', orderStatus: 'cancelled' }, 'a@b.com')).toBeNull();
    expect(buildSurveyOptInConfig({ orderNumber: 'ORD-1' }, 'not-an-email')).toBeNull();
    expect(buildSurveyOptInConfig({}, 'a@b.com')).toBeNull();
  });

  test('resolves guest email from checkout session storage', () => {
    rememberGoogleReviewOptIn({
      email: 'guest@example.com',
      orderNumber: 'ORD-9',
      orderId: 'abc',
    });
    expect(resolveReviewEmail({ orderNumber: 'ORD-9', _id: 'abc' })).toBe('guest@example.com');
    expect(resolveReviewEmail({ orderNumber: 'ORD-OTHER', _id: 'abc' })).toBeUndefined();
  });
});

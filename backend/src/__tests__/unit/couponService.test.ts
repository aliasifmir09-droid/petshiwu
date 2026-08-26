import { COUPONS, getCouponDiscount } from '../../services/couponService';

describe('couponService', () => {
  test('FREEDOM20 is 20% off capped at $10', () => {
    expect(getCouponDiscount('freedom20', 40)).toBe(8);
    expect(getCouponDiscount('FREEDOM20', 50)).toBe(10);
    expect(getCouponDiscount('FREEDOM20', 200)).toBe(10);
  });

  test('percent codes are not capped at the percent number in dollars', () => {
    expect(getCouponDiscount('WELCOME10', 200)).toBe(20);
    expect(getCouponDiscount('NYC10', 80)).toBe(8);
  });

  test('unknown codes do nothing', () => {
    expect(getCouponDiscount('NOTAREALCODE', 50)).toBe(0);
    expect(getCouponDiscount(undefined, 50)).toBe(0);
  });

  test('BDAYGIFT is 15% off and RESCUE10 is 10% off', () => {
    expect(getCouponDiscount('BDAYGIFT', 40)).toBe(6);
    expect(getCouponDiscount('bdaygift', 100)).toBe(15);
    expect(getCouponDiscount('RESCUE10', 50)).toBe(5);
  });

  test('advertised launch codes exist', () => {
    expect(COUPONS.FREEDOM20).toBeDefined();
    expect(COUPONS.WELCOME10).toBeDefined();
    expect(COUPONS.BDAYGIFT).toBeDefined();
    expect(COUPONS.RESCUE10).toBeDefined();
  });
});

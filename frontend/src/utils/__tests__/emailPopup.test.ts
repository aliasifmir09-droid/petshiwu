import { describe, expect, test } from 'vitest';
import {
  EMAIL_POPUP_DELAY_MS,
  isEmailPopupHiddenPath,
  shouldOfferEmailPopup,
} from '@/utils/emailPopup';

describe('email popup timing and pages', () => {
  test('waits 5 seconds on the current screen', () => {
    expect(EMAIL_POPUP_DELAY_MS).toBe(5000);
  });

  test('stays off checkout, cart, and account pages', () => {
    expect(isEmailPopupHiddenPath('/checkout')).toBe(true);
    expect(isEmailPopupHiddenPath('/cart')).toBe(true);
    expect(isEmailPopupHiddenPath('/login')).toBe(true);
    expect(isEmailPopupHiddenPath('/orders/abc')).toBe(true);
    expect(isEmailPopupHiddenPath('/')).toBe(false);
    expect(isEmailPopupHiddenPath('/dog/food')).toBe(false);
  });

  test('offers the popup to guests who have not dismissed it', () => {
    expect(
      shouldOfferEmailPopup({ pathname: '/', dismissed: false, isAuthenticated: false })
    ).toBe(true);
    expect(
      shouldOfferEmailPopup({ pathname: '/', dismissed: true, isAuthenticated: false })
    ).toBe(false);
    expect(
      shouldOfferEmailPopup({ pathname: '/', dismissed: false, isAuthenticated: true })
    ).toBe(false);
    expect(
      shouldOfferEmailPopup({ pathname: '/checkout', dismissed: false, isAuthenticated: false })
    ).toBe(false);
  });
});

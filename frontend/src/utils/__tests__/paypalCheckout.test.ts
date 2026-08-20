import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

describe('PayPal checkout', () => {
  test('wallet and card capture use the checkout token ref, not stale React state', () => {
    const button = read('../../components/PayPalButton.tsx');
    const card = read('../../components/PayPalCardFields.tsx');

    expect(button).toContain('checkoutTokenRef.current = createdCheckoutToken');
    expect(button).toContain('const checkoutToken = checkoutTokenRef.current');
    expect(button).not.toContain('setCheckoutToken(');

    expect(card).toContain('checkoutTokenRef.current = createdCheckoutToken');
    expect(card).toContain('const checkoutToken = checkoutTokenRef.current');
    expect(card).not.toContain('setCheckoutToken(');
  });

  test('Place Order for PayPal scrolls to the PayPal button instead of doing nothing', () => {
    const checkout = read('../../pages/Checkout.tsx');
    expect(checkout).toContain("getElementById('paypal-payment')");
    expect(checkout).toContain('Click the PayPal button to complete your payment.');
    expect(checkout).toContain('Continue to PayPal');
    expect(checkout).not.toMatch(
      /if \(paymentMethod === 'paypal' \|\| paymentMethod === 'apple_pay' \|\| paymentMethod === 'google_pay'\) return;/
    );
  });

  test('checkout warns when PayPal is still in sandbox test mode', () => {
    const checkout = read('../../pages/Checkout.tsx');
    expect(checkout).toContain('PayPal is in test mode');
    expect(checkout).toContain('!isPayPalLive');
  });
});

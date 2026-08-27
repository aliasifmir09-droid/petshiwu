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
    expect(checkout).toContain('Click Apple Pay, Google Pay, or a PayPal button to complete your payment.');
    expect(checkout).toContain('Continue to PayPal');
    expect(checkout).not.toMatch(
      /if \(paymentMethod === 'paypal' \|\| paymentMethod === 'apple_pay' \|\| paymentMethod === 'google_pay'\) return;/
    );
  });

  test('checkout shows branded Apple Pay, Google Pay, and PayPal instead of a plain radio list', () => {
    const checkout = read('../../pages/Checkout.tsx');
    const branded = read('../../components/CheckoutBrandedPayments.tsx');
    const paypalConfig = fs.readFileSync(
      path.resolve(__dirname, '../../config/paypal.ts'),
      'utf8'
    );

    expect(checkout).toContain('CheckoutBrandedPayments');
    expect(checkout).not.toContain('Pay with Apple Pay through PayPal');
    expect(checkout).not.toContain('Pay with Google Pay through PayPal');
    expect(checkout).not.toContain('Pay securely by card through PayPal');
    expect(checkout).not.toContain('PayPal Wallet');
    expect(checkout).toContain('Cash on Delivery');
    expect(checkout).toContain("setPaymentMethod('cod')");

    expect(branded).toContain('PayPalApplePay');
    expect(branded).toContain('PayPalGooglePay');
    expect(branded).toContain('skipProvider');
    expect(paypalConfig).toContain("components: 'buttons,applepay,googlepay'");
    expect(paypalConfig).toContain("disableFunding: ['card']");
    expect(paypalConfig).not.toContain("'venmo', 'paylater', 'card'");
    expect(checkout).toContain("setPaymentMethod('credit_card')");
    expect(checkout).toContain('Visa, Mastercard, Amex — typed on this page, not a PayPal popup.');
    expect(checkout).toContain('overflow-visible');
  });

  test('checkout does not tell shoppers PayPal is in test mode', () => {
    const checkout = read('../../pages/Checkout.tsx');
    expect(checkout).not.toContain('PayPal is in test mode');
    expect(checkout).not.toContain('!isPayPalLive');
  });

  test('PayPal is live unless sandbox is explicit', () => {
    const paypalConfig = read('../../config/paypal.ts');
    expect(paypalConfig).toContain("paypalEnv !== 'sandbox'");
    expect(paypalConfig).toContain("paypalClientId !== 'sb'");
    expect(paypalConfig).not.toContain("import.meta.env.VITE_PAYPAL_ENV === 'live'");
  });

  test('checkout keeps the optional shelter charity card in the order summary', () => {
    const checkout = read('../../pages/Checkout.tsx');
    expect(checkout).toContain('CheckoutCharityCard');
    expect(checkout).toContain('donationAmount={donationAmount}');
    expect(checkout).toContain('Almost home.');
  });
});

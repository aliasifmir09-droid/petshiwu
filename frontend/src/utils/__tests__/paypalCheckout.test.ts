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
    expect(button).toContain('fundingSource={fundingSource}');
    expect(button).toContain('fundingSource = FUNDING.PAYPAL');
    expect(button).toContain('FUNDING.CARD');

    expect(card).toContain('checkoutTokenRef.current = createdCheckoutToken');
    expect(card).toContain('const checkoutToken = checkoutTokenRef.current');
    expect(card).not.toContain('setCheckoutToken(');
  });

  test('Place Order for PayPal scrolls to the PayPal button instead of doing nothing', () => {
    const checkout = read('../../pages/Checkout.tsx');
    expect(checkout).toContain("getElementById('paypal-payment')");
    expect(checkout).toContain('Choose Apple Pay, Google Pay, card, or PayPal to complete your payment.');
    expect(checkout).toContain('Pay with Apple Pay, Google Pay, card, or PayPal below');
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
    expect(checkout).not.toContain('Cash on Delivery');
    expect(checkout).not.toContain("setPaymentMethod('cod')");

    expect(branded).toContain('PayPalApplePay');
    expect(branded).toContain('PayPalGooglePay');
    expect(branded).toContain('PayPalCardFields');
    expect(branded).toContain('skipProvider');
    expect(branded).toContain('id="card-payment"');
    expect(branded).toContain('Credit or debit card');
    expect(branded).toContain('overflow-visible');
    const apple = read('../../components/PayPalApplePay.tsx');
    const google = read('../../components/PayPalGooglePay.tsx');
    expect(apple).not.toContain('components=applepay');
    expect(google).not.toContain('components=googlepay');
    expect(paypalConfig).toContain("components: 'buttons,applepay,googlepay,card-fields'");
    expect(paypalConfig).toContain("disableFunding: ['venmo', 'paylater']");
    expect(paypalConfig).not.toContain("disableFunding: ['card', 'venmo', 'paylater']");
    expect(paypalConfig).not.toContain('enableFunding');
    expect(checkout).toContain("setPaymentMethod('credit_card')");
    expect(checkout).not.toContain('STRIPE_SECRET_KEY');
    expect(checkout).toContain('overflow-visible');
    expect(checkout).toContain('paypal-wallet-slot');
    expect(checkout).toContain("paymentMethod === 'paypal' || paymentMethod === 'apple_pay' || paymentMethod === 'google_pay'");
    expect(checkout).toContain('hideCardFields={usingSavedCard}');
    const card = read('../../components/PayPalCardFields.tsx');
    expect(card).toContain('PayPalNumberField');
    expect(card).toContain('Card number');
    expect(card).toContain('CardFieldSkeletons');
    expect(branded).toContain('CardFieldSkeletons');
    expect(branded).toContain('FUNDING.CARD');
    expect(branded).not.toContain('min-h-[12rem]');
    expect(checkout).not.toContain('showPayPalButton');
    expect(checkout).not.toContain('deliveryReady');
    expect(checkout).not.toContain('Enter your delivery details above');
    expect(checkout).not.toContain('card fields will open here');
    expect(checkout).not.toContain('PayPal, Venmo, or card');
  });

  test('checkout CSS hides stray Venmo and Pay Later bars that jump over the header', () => {
    const css = read('../../index.css');
    expect(css).toContain('iframe[title="Venmo"]');
    expect(css).toContain('iframe[title="PayPal Pay Later"]');
    expect(css).toContain('.paypal-wallet-slot');
    expect(css).toContain('.petshiwu-card-field');
    expect(css).not.toContain('.paypal-checkout-sandbox {');
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

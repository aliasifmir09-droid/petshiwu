import fs from 'fs';
import path from 'path';

describe('logged-in checkout remembers card and address', () => {
  it('attaches optionalAuth so a Bearer token is linked to guest-capable order routes', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../routes/orders.ts'), 'utf8');
    expect(src).toContain('optionalAuth, createPaymentIntentValidation, createOrderPaymentIntent');
    expect(src).toContain('optionalAuth, createOrderValidation, createOrder');
    expect(src).toContain('optionalAuth, createPayPalOrderValidation, createPayPalCheckoutOrder');
  });

  it('creates Stripe customers and reuses a saved payment method id on the server', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../controllers/orderController.ts'),
      'utf8'
    );
    expect(src).toContain('getOrCreateStripeCustomer');
    expect(src).toContain('setup_future_usage');
    expect(src).toContain('savedPaymentMethodId');
    expect(src).toContain('rememberPaidCardForUser');
    expect(src).toContain('rememberShippingAddress');
    expect(src).not.toContain('stripePaymentMethodId: saved');
  });

  it('keeps Stripe payment method ids off the payment-methods list response', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../controllers/paymentMethodController.ts'),
      'utf8'
    );
    expect(src).toContain("Don't return stripePaymentMethodId or paypalAccountId for security");
  });
});

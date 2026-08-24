import { buildCreatePayPalOrderBody, formatPayPalApiError, getPayPalBaseUrl, isPayPalLive } from '../../services/paypalService';

describe('PayPal environment', () => {
  const originalEnv = process.env.PAYPAL_ENV;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.PAYPAL_ENV;
    } else {
      process.env.PAYPAL_ENV = originalEnv;
    }
  });

  it('uses the sandbox API unless PAYPAL_ENV is live', () => {
    delete process.env.PAYPAL_ENV;
    expect(isPayPalLive()).toBe(false);
    expect(getPayPalBaseUrl()).toBe('https://api-m.sandbox.paypal.com');
  });

  it('uses the live API when PAYPAL_ENV is live', () => {
    process.env.PAYPAL_ENV = 'live';
    expect(isPayPalLive()).toBe(true);
    expect(getPayPalBaseUrl()).toBe('https://api-m.paypal.com');
  });

  it('adds 3-D Secure only for Card Fields create-order payloads', () => {
    const wallet = buildCreatePayPalOrderBody(19.99, 'USD', 'checkout-token-wallet');
    expect(wallet.intent).toBe('CAPTURE');
    expect(wallet.payment_source).toBeUndefined();

    const card = buildCreatePayPalOrderBody(19.99, 'USD', 'checkout-token-card', 'card');
    expect(card.payment_source).toEqual({
      card: {
        attributes: {
          verification: {
            method: 'SCA_WHEN_REQUIRED'
          }
        }
      }
    });
  });

  it('turns INSTRUMENT_DECLINED into a shopper-facing retry message', () => {
    const message = formatPayPalApiError(422, JSON.stringify({
      name: 'UNPROCESSABLE_ENTITY',
      details: [{ issue: 'INSTRUMENT_DECLINED', description: 'The instrument presented was declined.' }]
    }));
    expect(message).toBe('This payment method was declined. Please try a different card or PayPal Wallet.');
  });
});

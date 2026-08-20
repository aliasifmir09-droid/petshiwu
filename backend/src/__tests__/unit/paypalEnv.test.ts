import { getPayPalBaseUrl, isPayPalLive } from '../../../services/paypalService';

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
});

export const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;

const paypalEnv = String(import.meta.env.VITE_PAYPAL_ENV || '').toLowerCase();

/**
 * Live is the default. Checkout used to treat an unset VITE_PAYPAL_ENV as
 * sandbox and warn shoppers, even after real PayPal charges succeeded.
 * Sandbox is opt-in: VITE_PAYPAL_ENV=sandbox or PayPal's demo client-id `sb`.
 */
export const isPayPalLive = paypalClientId !== 'sb' && paypalEnv !== 'sandbox';

export const paypalSdkEnvironment: 'production' | 'sandbox' = isPayPalLive ? 'production' : 'sandbox';

export const paypalCheckoutScriptOptions = (currency = 'USD') => ({
  clientId: paypalClientId || '',
  currency,
  intent: 'capture' as const,
  environment: paypalSdkEnvironment,
  components: 'buttons,applepay,googlepay',
  enableFunding: ['venmo', 'paylater', 'card'],
  ...(!isPayPalLive ? { buyerCountry: 'US' } : {}),
});

export const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;

/** Frontend PayPal SDK environment. Must match backend PAYPAL_ENV. */
export const isPayPalLive = import.meta.env.VITE_PAYPAL_ENV === 'live';

export const paypalSdkEnvironment: 'production' | 'sandbox' = isPayPalLive ? 'production' : 'sandbox';

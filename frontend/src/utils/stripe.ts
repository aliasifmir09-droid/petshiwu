// Lazy load Stripe to avoid loading it on pages that don't need it
let stripePromise: Promise<any> | null = null;
let stripeModule: any = null;

export const getStripe = async (): Promise<any> => {
  // Lazy load the Stripe module only when needed
  if (!stripeModule) {
    try {
      stripeModule = await import('@stripe/stripe-js');
    } catch (error) {
      console.error('Failed to load Stripe:', error);
      return Promise.resolve(null);
    }
  }

  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.warn('Stripe publishable key not found. Set VITE_STRIPE_PUBLISHABLE_KEY in your .env file.');
      return Promise.resolve(null);
    }

    // Only load Stripe.js script when getStripe is actually called
    stripePromise = stripeModule.loadStripe(publishableKey);
  }

  return stripePromise;
};


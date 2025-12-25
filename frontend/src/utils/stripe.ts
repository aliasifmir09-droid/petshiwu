// Lazy load Stripe to avoid loading it on pages that don't need it
let stripePromise: Promise<any> | null = null;
let stripeModule: any = null;

export const getStripe = async (): Promise<any> => {
  // Lazy load the Stripe module only when needed
  if (!stripeModule) {
    try {
      // Use dynamic import with chunk splitting to avoid blocking
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

    // Load Stripe.js script - loadStripe already loads asynchronously
    // We defer it slightly to yield to browser for other critical tasks
    stripePromise = new Promise((resolve, reject) => {
      const loadStripeScript = () => {
        stripeModule.loadStripe(publishableKey)
          .then(resolve)
          .catch(reject);
      };

      // Defer loading to next event loop tick to avoid blocking
      // This allows browser to complete other critical tasks first
      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadStripeScript, { timeout: 500 });
      } else {
        // Fallback: use setTimeout to yield to browser
        setTimeout(loadStripeScript, 0);
      }
    });
  }

  return stripePromise;
};


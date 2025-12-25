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

    // Load Stripe.js script with defer to avoid blocking main thread
    // The loadStripe function loads the script asynchronously, but we can further defer it
    stripePromise = new Promise((resolve, reject) => {
      // Use requestIdleCallback if available to load during idle time
      const loadStripeScript = () => {
        stripeModule.loadStripe(publishableKey)
          .then(resolve)
          .catch(reject);
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadStripeScript, { timeout: 1000 });
      } else {
        // Fallback: small delay to yield to browser
        setTimeout(loadStripeScript, 0);
      }
    });
  }

  return stripePromise;
};


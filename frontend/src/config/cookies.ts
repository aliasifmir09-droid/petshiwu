export const COOKIE_CONSENT_STORAGE_KEY = 'petshiwu_cookie_consent';

export type CookieParty = 'First-party' | 'Third-party';
export type CookieCategory = 'Essential' | 'Analytics' | 'Marketing' | 'Functional';

export type CookieRow = {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  party: CookieParty;
  category: CookieCategory;
};

/** Technologies actually used on petshiwu.com. Do not list pixels we do not run. */
export const COOKIE_INVENTORY: CookieRow[] = [
  {
    name: 'petshiwu_cookie_consent',
    provider: 'Petshiwu',
    purpose: 'Stores whether you accepted or declined analytics cookies',
    duration: 'Until you clear site data',
    party: 'First-party',
    category: 'Essential',
  },
  {
    name: 'token (local storage)',
    provider: 'Petshiwu',
    purpose: 'Keeps you signed in so you can see orders and start a return',
    duration: 'Until you sign out or the session expires',
    party: 'First-party',
    category: 'Essential',
  },
  {
    name: 'cart-storage (local storage)',
    provider: 'Petshiwu',
    purpose: 'Saves your shopping cart on this device',
    duration: 'Until you clear the cart or site data',
    party: 'First-party',
    category: 'Essential',
  },
  {
    name: 'petshiwu_last_zip',
    provider: 'Petshiwu',
    purpose: 'Remembers the NYC ZIP you entered for same-day eligibility',
    duration: 'Until you clear site data',
    party: 'First-party',
    category: 'Functional',
  },
  {
    name: 'recently_viewed_products',
    provider: 'Petshiwu',
    purpose: 'Shows products you recently viewed',
    duration: 'Until you clear site data',
    party: 'First-party',
    category: 'Functional',
  },
  {
    name: '_ga, _gid, _gat',
    provider: 'Google LLC (Google Analytics 4)',
    purpose: 'Measures visits, page views, and shop events after you tap Accept',
    duration: 'Up to 2 years (_ga); 24 hours (_gid)',
    party: 'Third-party',
    category: 'Analytics',
  },
  {
    name: 'Google Sign-In cookies',
    provider: 'Google LLC',
    purpose: 'Lets you sign in with Google if you choose that option',
    duration: 'Set by Google; typically session to 2 years',
    party: 'Third-party',
    category: 'Essential',
  },
  {
    name: 'PayPal cookies',
    provider: 'PayPal, Inc.',
    purpose: 'Process PayPal, PayPal Card Fields, Apple Pay, and Google Pay at checkout',
    duration: 'Set by PayPal; typically session to 2 years',
    party: 'Third-party',
    category: 'Essential',
  },
  {
    name: 'Stripe cookies',
    provider: 'Stripe, Inc.',
    purpose: 'Process saved-card payments and fraud checks at checkout',
    duration: 'Set by Stripe; typically session to 2 years',
    party: 'Third-party',
    category: 'Essential',
  },
  {
    name: 'Google Places',
    provider: 'Google LLC',
    purpose: 'Autocomplete shipping addresses at checkout',
    duration: 'Set by Google for that checkout session',
    party: 'Third-party',
    category: 'Functional',
  },
];

export const hasAnalyticsConsent = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) === 'accepted';
};

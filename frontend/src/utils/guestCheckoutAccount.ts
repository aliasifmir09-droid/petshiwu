const GUEST_CHECKOUT_KEY = 'petshiwu_guest_checkout';

export type GuestCheckoutAccount = {
  email: string;
  firstName?: string;
  lastName?: string;
};

const readBrowserStore = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const rememberGuestCheckoutAccount = (details: GuestCheckoutAccount): void => {
  const store = readBrowserStore();
  const email = String(details.email || '').trim();
  if (!store || !email) return;
  try {
    store.setItem(GUEST_CHECKOUT_KEY, JSON.stringify({
      email,
      firstName: String(details.firstName || '').trim(),
      lastName: String(details.lastName || '').trim(),
    }));
  } catch {
    // Private mode can block sessionStorage.
  }
};

export const readGuestCheckoutAccount = (): GuestCheckoutAccount | null => {
  const store = readBrowserStore();
  if (!store) return null;
  try {
    const raw = store.getItem(GUEST_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestCheckoutAccount;
    const email = String(parsed?.email || '').trim();
    if (!email) return null;
    return {
      email,
      firstName: String(parsed.firstName || '').trim() || undefined,
      lastName: String(parsed.lastName || '').trim() || undefined,
    };
  } catch {
    return null;
  }
};

export const guestSetPasswordPath = (email?: string): string => {
  const params = new URLSearchParams({ guest: '1' });
  const trimmed = String(email || '').trim();
  if (trimmed) params.set('email', trimmed);
  return `/forgot-password?${params.toString()}`;
};

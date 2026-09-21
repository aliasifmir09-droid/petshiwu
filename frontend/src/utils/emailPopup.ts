export const EMAIL_POPUP_STORAGE_KEY = 'petshiwu_popup_dismissed';
export const EMAIL_POPUP_DELAY_MS = 5000;

const HIDDEN_PREFIXES = [
  '/checkout',
  '/cart',
  '/login',
  '/register',
  '/unsubscribe',
  '/orders',
  '/pay',
];

export const isEmailPopupHiddenPath = (pathname: string): boolean =>
  HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const shouldOfferEmailPopup = ({
  pathname,
  dismissed,
  isAuthenticated,
}: {
  pathname: string;
  dismissed: boolean;
  isAuthenticated: boolean;
}): boolean => {
  if (dismissed || isAuthenticated) return false;
  return !isEmailPopupHiddenPath(pathname);
};

/**
 * Old password-reset emails used HashRouter: /#/reset-password?token=
 * The storefront uses BrowserRouter: /reset-password?token=
 */
export function hashAuthRedirect(hash: string): string | null {
  const raw = String(hash || '');
  const match = raw.match(/^#\/(reset-password|verify-email)(?:\?(.*))?$/i);
  if (!match) return null;
  return `/${match[1]}${match[2] ? `?${match[2]}` : ''}`;
}

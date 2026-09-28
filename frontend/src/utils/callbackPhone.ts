/** Normalize and pull a US callback number from chat text. */

export function normalizeCallbackPhone(raw: string | undefined | null): string | null {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  if (hasPlus) {
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return null;
  }
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export function extractCallbackPhone(text: string | undefined | null): string | null {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const direct = normalizeCallbackPhone(raw);
  if (direct) return direct;

  const matches = raw.match(/(?:\+?1[\s.-]*)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]*\d{4}/g);
  if (!matches) return null;
  for (const match of matches) {
    const phone = normalizeCallbackPhone(match);
    if (phone) return phone;
  }
  return null;
}

export function formatCallbackPhone(e164: string): string {
  const digits = String(e164 || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return e164;
}

export const CALLBACK_HIDDEN_PREFIXES = [
  '/checkout',
  '/cart',
  '/login',
  '/register',
  '/unsubscribe',
  '/orders',
  '/pay',
];

export const isCallbackChatHiddenPath = (pathname: string): boolean =>
  CALLBACK_HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/** Normalize US checkout phones to E.164 so formatted numbers still pass the API. */
export const normalizeCheckoutPhone = (raw: string | undefined | null): string => {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  if (hasPlus) {
    if (digits.length < 10 || digits.length > 15) return trimmed;
    return `+${digits}`;
  }
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits;
};

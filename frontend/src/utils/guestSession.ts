const GUEST_SESSION_KEY = 'petshiwu_guest_session';

export const getGuestSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    const existing = localStorage.getItem(GUEST_SESSION_KEY);
    if (existing && existing.length >= 8) return existing;
    const created = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(GUEST_SESSION_KEY, created);
    return created;
  } catch {
    return '';
  }
};

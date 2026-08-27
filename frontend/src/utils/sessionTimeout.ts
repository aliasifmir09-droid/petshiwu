export const CUSTOMER_AWAY_TIMEOUT_MS = 60 * 1000;
export const LAST_ACTIVE_KEY = 'petshiwu_last_active_at';

export const readLastActiveAt = (): number => {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
};

export const touchCustomerActivity = (at: number = Date.now()): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(at));
  } catch {
    // ignore
  }
};

export const clearCustomerActivity = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LAST_ACTIVE_KEY);
  } catch {
    // ignore
  }
};

export const shouldExpireCustomerSession = (
  lastActiveAt: number,
  currentTime: number,
  timeoutMs: number = CUSTOMER_AWAY_TIMEOUT_MS
): boolean => {
  if (!lastActiveAt) return false;
  return currentTime - lastActiveAt >= timeoutMs;
};

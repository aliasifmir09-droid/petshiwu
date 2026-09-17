import { describe, expect, test } from 'vitest';
import { COOKIE_INVENTORY } from '@/config/cookies';

describe('cookie inventory', () => {
  test('lists provider, purpose, duration, and first vs third party', () => {
    expect(COOKIE_INVENTORY.length).toBeGreaterThan(5);
    for (const row of COOKIE_INVENTORY) {
      expect(row.name).toBeTruthy();
      expect(row.provider).toBeTruthy();
      expect(row.purpose).toBeTruthy();
      expect(row.duration).toBeTruthy();
      expect(['First-party', 'Third-party']).toContain(row.party);
    }
    expect(COOKIE_INVENTORY.some((row) => row.name.includes('_ga'))).toBe(true);
    expect(COOKIE_INVENTORY.some((row) => row.name.includes('petshiwu_cookie_consent'))).toBe(true);
  });
});

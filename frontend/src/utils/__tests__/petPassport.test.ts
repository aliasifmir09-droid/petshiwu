import { describe, expect, test, beforeEach } from 'vitest';
import {
  hasActivePassport,
  isKnownSpecies,
  loadPassport,
  savePassport,
  shopPathForPassport,
  skipPassport,
  PASSPORT_KEY,
} from '../petPassport';

describe('petPassport', () => {
  beforeEach(() => localStorage.clear());

  test('saves and loads an active passport', () => {
    savePassport({ name: 'Bella', species: 'dog', createdAt: '2026-08-13' });
    const loaded = loadPassport();
    expect(loaded?.name).toBe('Bella');
    expect(hasActivePassport(loaded)).toBe(true);
    expect(shopPathForPassport(loaded)).toBe('/products?petType=dog');
  });

  test('skipped passport is not active', () => {
    skipPassport();
    expect(hasActivePassport(loadPassport())).toBe(false);
    expect(localStorage.getItem(PASSPORT_KEY)).toBeTruthy();
  });

  test('isKnownSpecies', () => {
    expect(isKnownSpecies('cat')).toBe(true);
    expect(isKnownSpecies('dragon')).toBe(false);
  });
});

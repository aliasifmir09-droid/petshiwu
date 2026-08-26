import { describe, expect, test } from 'vitest';
import { hashAuthRedirect } from '../hashAuthRedirect';

describe('hashAuthRedirect', () => {
  test('converts old HashRouter password-reset mail links', () => {
    expect(hashAuthRedirect('#/reset-password?token=abc123')).toBe(
      '/reset-password?token=abc123'
    );
  });

  test('converts old HashRouter verify-email links', () => {
    expect(hashAuthRedirect('#/verify-email?token=xyz')).toBe('/verify-email?token=xyz');
  });

  test('ignores unrelated hashes', () => {
    expect(hashAuthRedirect('#section')).toBeNull();
    expect(hashAuthRedirect('')).toBeNull();
  });
});

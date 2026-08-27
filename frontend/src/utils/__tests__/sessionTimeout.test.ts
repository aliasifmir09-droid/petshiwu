import { describe, expect, test } from 'vitest';
import { shouldExpireCustomerSession } from '../sessionTimeout';

describe('shouldExpireCustomerSession', () => {
  test('keeps the session if the customer left less than a minute ago', () => {
    expect(shouldExpireCustomerSession(1_000, 1_000 + 59_000)).toBe(false);
  });

  test('expires the session after 1 minute away', () => {
    expect(shouldExpireCustomerSession(1_000, 1_000 + 60_000)).toBe(true);
    expect(shouldExpireCustomerSession(0, 1_000 + 60_000)).toBe(false);
  });
});

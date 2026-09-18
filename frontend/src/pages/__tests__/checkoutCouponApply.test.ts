import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));
const checkout = readFileSync(join(dir, '../Checkout.tsx'), 'utf8');

describe('checkout applies codes through the store API client', () => {
  test('does not raw-fetch the /coupons path that ad blockers strip', () => {
    expect(checkout).toContain('applyCheckoutCode');
    expect(checkout).toContain('recordCheckoutCodeUse');
    expect(checkout).not.toMatch(/coupons\/validate/);
    expect(checkout).not.toMatch(/coupons\/use/);
    expect(checkout).not.toMatch(/VITE_API_URL/);
  });

  test('does not require email before asking the API to validate a code', () => {
    expect(checkout).not.toMatch(/enter your email address above before applying a coupon/i);
  });
});

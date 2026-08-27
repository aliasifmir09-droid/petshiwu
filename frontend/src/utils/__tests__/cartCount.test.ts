import { describe, expect, test } from 'vitest';
import { cartItemCount } from '../cartCount';

describe('cartItemCount', () => {
  test('returns 0 when items is missing so the header cannot crash', () => {
    expect(cartItemCount(undefined)).toBe(0);
    expect(cartItemCount(null)).toBe(0);
    expect(cartItemCount({})).toBe(0);
  });

  test('sums quantities', () => {
    expect(cartItemCount([{ quantity: 1 }, { quantity: 2 }])).toBe(3);
  });
});

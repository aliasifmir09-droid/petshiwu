import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

describe('cash on delivery checkout', () => {
  test('checkout no longer offers Cash on Delivery', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../pages/Checkout.tsx'),
      'utf8'
    );
    expect(src).not.toContain("setPaymentMethod('cod')");
    expect(src).not.toContain('Cash on Delivery');
    expect(src).not.toContain('Place cash on delivery order');
  });
});

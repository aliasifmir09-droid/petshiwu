import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

describe('cash on delivery checkout', () => {
  test('checkout offers Cash on Delivery without a card', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../pages/Checkout.tsx'),
      'utf8'
    );
    expect(src).toContain("setPaymentMethod('cod')");
    expect(src).toContain('Cash on Delivery');
    expect(src).toContain('Place cash on delivery order');
  });
});

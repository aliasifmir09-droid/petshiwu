import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

describe('secure checkout chrome', () => {
  test('checkout hides the store header and uses a lock bar', () => {
    const app = read('../../App.tsx');
    const header = read('../../components/CheckoutSecureHeader.tsx');
    expect(app).toContain("pathname === '/checkout'");
    expect(app).toContain('{!isCheckout && <Header />}');
    expect(header).toContain('Secure checkout');
    expect(header).toContain('24/7');
    expect(header).toContain('Continue shopping');
  });

  test('confidence card beats a generic trust strip', () => {
    const card = read('../../components/CheckoutConfidence.tsx');
    expect(card).toContain('Shop with confidence');
    expect(card).toContain('No surprise autoship');
    expect(card).toContain('365-day returns');
    expect(card).toContain('PayPal-secured');
    expect(card).toContain('24/7 humans');
  });

  test('place order sits in the summary and agrees to policy links', () => {
    const checkout = read('../../pages/Checkout.tsx');
    expect(checkout).toContain('id="checkout-place-order"');
    expect(checkout).toContain('By placing your order');
    expect(checkout).toContain("to=\"/privacy\"");
    expect(checkout).toContain("to=\"/terms\"");
    expect(checkout).toContain('CheckoutConfidence');
    expect(checkout).toContain('CheckoutSecureHeader');
    expect(checkout).toContain('form="checkout-form"');
  });
});

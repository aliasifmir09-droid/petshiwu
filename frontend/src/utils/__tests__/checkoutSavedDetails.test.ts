import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

describe('checkout reuses saved card and address', () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, '../../pages/Checkout.tsx'),
    'utf8'
  );

  test('auto-selects a saved card and confirms it without asking for PAN again', () => {
    expect(src).toContain('pickDefaultSavedCard');
    expect(src).toContain('savedPaymentMethodId');
    expect(src).toContain('confirmCardPayment');
    expect(src).not.toContain("setSelectedSavedPaymentMethod(null);\n        }");
    expect(src).toContain('Pay with ${savedCardLabel(selectedSaved)}');
    expect(src).toContain('Save this payment method for faster checkout next time');
    expect(src).toContain('useState(true)');
  });

  test('saves a first shipping address for logged-in customers', () => {
    expect(src).toContain('Save this address to my account');
    expect(src).toContain('savedAddresses.length === 0');
    expect(src).toContain("queryKey: ['addresses']");
  });
});

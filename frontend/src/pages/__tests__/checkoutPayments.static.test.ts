import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));

describe('checkout payment widgets stay on the page', () => {
  test('Checkout does not lazy-import PayPal chunks that ad blockers strip', () => {
    const source = readFileSync(join(dir, '../Checkout.tsx'), 'utf8');
    expect(source).toMatch(/import CheckoutBrandedPayments from/);
    expect(source).not.toMatch(/lazy\(\(\) => import\('@\/components\/CheckoutBrandedPayments'\)\)/);
    expect(source).not.toMatch(/lazy\(\(\) => import\('@\/components\/PayPalCardFields'\)\)/);
  });

  test('branded PayPal buttons are static imports, not extra PayPal-named chunks', () => {
    const source = readFileSync(join(dir, '../../components/CheckoutBrandedPayments.tsx'), 'utf8');
    expect(source).toMatch(/import PayPalButton from/);
    expect(source).toMatch(/import PayPalCardFields, \{ CardFieldSkeletons \} from/);
    expect(source).not.toMatch(/lazy\(\(\) => import\('@\/components\/PayPal/);
  });
});

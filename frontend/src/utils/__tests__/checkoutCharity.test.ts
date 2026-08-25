import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

describe('checkout charity donation', () => {
  test('checkout shows an optional charity card before the order total', () => {
    const checkout = read('../../pages/Checkout.tsx');
    expect(checkout).toContain("import CheckoutCharityCard from '@/components/CheckoutCharityCard'");
    expect(checkout).toContain('<CheckoutCharityCard amount={donationAmount} onChange={setDonationAmount} />');
    expect(checkout).toContain('Shelter donation');
    expect(checkout).not.toContain('CheckoutDonationModal');
    expect(checkout).not.toContain('donationAmount={0}');
  });

  test('checkout charges the selected donation with the order instead of stripping it after payment', () => {
    const checkout = read('../../pages/Checkout.tsx');
    expect(checkout).toContain('createOrderMutation.mutate(orderData)');
    expect(checkout).toContain('donationAmount: donationAmount > 0 ? donationAmount : undefined');
    expect(checkout).toContain('totalPrice: total');
    expect(checkout).not.toContain('donationAmount: undefined');
    expect(checkout).not.toContain('totalPrice: onlineTotal');
  });

  test('PayPal wallet and card send the live donation amount, not a stale zero', () => {
    const button = read('../../components/PayPalButton.tsx');
    const card = read('../../components/PayPalCardFields.tsx');
    const googlePay = read('../../components/PayPalGooglePay.tsx');

    expect(button).toContain('donationAmountRef.current = donationAmount');
    expect(button).toContain('donationAmount: donationAmountRef.current');
    expect(card).toContain('donationAmountRef.current = props.donationAmount');
    expect(card).toContain('donationAmount: donationAmountRef.current');
    expect(googlePay).toContain('donationAmountRef.current = donationAmount');
    expect(googlePay).toContain('donationAmount: donationAmountRef.current');
  });
});

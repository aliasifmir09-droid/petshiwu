import fs from 'fs';
import path from 'path';
import {
  getPayPalCapturedAmount,
  getPayPalCurrency,
  hasPayPalSettlement,
  payPalCurrenciesMatch,
  type PayPalOrderResponse
} from '../../services/paypalService';

const approvedOrder: PayPalOrderResponse = {
  id: 'ORDER1',
  status: 'APPROVED',
  purchase_units: [{
    custom_id: 'checkout-token',
    amount: { currency_code: 'USD', value: '12.15' }
  }]
};

describe('PayPal settlement parsing', () => {
  it('reads amount and currency from an approved order before capture', () => {
    expect(getPayPalCurrency(approvedOrder)).toBe('USD');
    expect(getPayPalCapturedAmount(approvedOrder)).toBe(12.15);
    expect(hasPayPalSettlement(approvedOrder)).toBe(true);
  });

  it('treats PayPal capture default minimal body as missing settlement', () => {
    const minimalCapture: PayPalOrderResponse = { id: 'ORDER1', status: 'COMPLETED' };
    expect(getPayPalCurrency(minimalCapture)).toBeNull();
    expect(getPayPalCapturedAmount(minimalCapture)).toBeNull();
    expect(hasPayPalSettlement(minimalCapture)).toBe(false);
  });

  it('reads card-field captures that omit purchase_units.amount', () => {
    const captured: PayPalOrderResponse = {
      id: 'ORDER1',
      status: 'COMPLETED',
      purchase_units: [{
        payments: {
          captures: [{
            status: 'COMPLETED',
            amount: { currency_code: 'USD', value: '12.15' }
          }]
        }
      }]
    };

    expect(getPayPalCurrency(captured)).toBe('USD');
    expect(getPayPalCapturedAmount(captured)).toBe(12.15);
  });

  it('accepts pending card captures and seller receivable breakdown', () => {
    const pendingCapture: PayPalOrderResponse = {
      id: 'ORDER1',
      status: 'COMPLETED',
      purchase_units: [{
        payments: {
          captures: [{
            status: 'PENDING',
            seller_receivable_breakdown: {
              gross_amount: { currency_code: 'usd', value: '12.15' }
            }
          }]
        }
      }]
    };

    expect(getPayPalCurrency(pendingCapture)).toBe('USD');
    expect(getPayPalCapturedAmount(pendingCapture)).toBe(12.15);
    expect(payPalCurrenciesMatch('USD', getPayPalCurrency(pendingCapture))).toBe(true);
  });

  it('reads legacy amount.currency on a capture-shaped response', () => {
    const captureResource: PayPalOrderResponse = {
      id: 'CAPTURE1',
      status: 'COMPLETED',
      amount: { currency: 'USD', value: '12.15' }
    };

    expect(getPayPalCurrency(captureResource)).toBe('USD');
    expect(getPayPalCapturedAmount(captureResource)).toBe(12.15);
  });

  it('does not treat a declined capture as paid', () => {
    const declined: PayPalOrderResponse = {
      id: 'ORDER1',
      status: 'COMPLETED',
      purchase_units: [{
        payments: {
          captures: [{
            status: 'DECLINED',
            amount: { currency_code: 'USD', value: '12.15' }
          }]
        }
      }]
    };

    expect(getPayPalCurrency(declined)).toBeNull();
    expect(getPayPalCapturedAmount(declined)).toBeNull();
  });

  it('rejects currency mismatches instead of skipping the check', () => {
    expect(payPalCurrenciesMatch('USD', 'EUR')).toBe(false);
    expect(payPalCurrenciesMatch('USD', null)).toBe(false);
    expect(payPalCurrenciesMatch('USD', 'unknown')).toBe(false);
  });
});

describe('PayPal capture requests the full order body', () => {
  const serviceSrc = fs.readFileSync(
    path.resolve(__dirname, '../../services/paypalService.ts'),
    'utf8'
  );
  const controllerSrc = fs.readFileSync(
    path.resolve(__dirname, '../../controllers/orderController.ts'),
    'utf8'
  );

  it('asks PayPal for return=representation on capture', () => {
    expect(serviceSrc).toMatch(/export const capturePayPalOrder[\s\S]*Prefer: 'return=representation'/);
  });

  it('re-reads the PayPal order when capture omits currency and amount', () => {
    expect(controllerSrc).toContain('hasPayPalSettlement');
    expect(controllerSrc).toContain('payPalCurrenciesMatch');
    expect(controllerSrc).toContain('paypalCurrency = preCaptureCurrency');
    expect(controllerSrc).toContain('capturedAmount = preCaptureAmount');
  });
});

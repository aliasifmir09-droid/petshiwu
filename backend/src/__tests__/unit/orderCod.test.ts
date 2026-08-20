import fs from 'fs';
import path from 'path';

describe('createOrder cash on delivery', () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, '../../controllers/orderController.ts'),
    'utf8'
  );

  it('no longer blocks Cash on Delivery', () => {
    expect(src).not.toContain('Cash on Delivery is no longer available');
  });

  it('keeps COD orders unpaid until delivery', () => {
    expect(src).toContain("paymentMethod === 'cod' ? 'pending'");
    expect(src).toContain('collect cash on delivery');
  });
});

describe('createOrder validation allows cash on delivery', () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, '../../middleware/validation.ts'),
    'utf8'
  );

  it('accepts cod on createOrderValidation', () => {
    const createOrderBlock = src.slice(
      src.indexOf('export const createOrderValidation'),
      src.indexOf('export const createReviewValidation')
    );
    expect(createOrderBlock).toContain("'cod'");
  });

  it('does not require Stripe for COD payment intents', () => {
    const paymentIntentBlock = src.slice(
      src.indexOf('export const createPaymentIntentValidation'),
      src.indexOf('const paypalItemsValidation')
    );
    expect(paymentIntentBlock).not.toContain("'cod'");
  });
});

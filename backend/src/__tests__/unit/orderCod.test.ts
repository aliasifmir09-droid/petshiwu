import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Order from '../../models/Order';

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

function checkoutOrder(overrides: Record<string, unknown> = {}) {
  return new Order({
    items: [{
      product: new mongoose.Types.ObjectId(),
      name: 'Whisker City 2-Door Pet Carrier',
      image: 'https://cdn.example.com/carrier.jpg',
      price: 41.99,
      quantity: 1,
      variant: { sku: 'WC-2DOOR' },
    }],
    shippingAddress: {
      firstName: 'Ali',
      lastName: 'Mir',
      street: '37-68 74th St',
      city: 'Queens',
      state: 'NY',
      zipCode: '11372',
      country: 'USA',
      phone: '12125551212',
    },
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    itemsPrice: 41.99,
    shippingPrice: 6,
    taxPrice: 3.36,
    totalPrice: 51.35,
    ...overrides,
  });
}

describe('Order delivery proof is not required at checkout', () => {
  it('lets a cash on delivery order save without a driver handoff method', () => {
    const err = checkoutOrder().validateSync();
    expect(err).toBeUndefined();
  });

  it('still requires a handoff method when a driver uploads proof', () => {
    const err = checkoutOrder({
      delivery: {
        status: 'delivered',
        proof: { uploadedAt: new Date() },
      },
    }).validateSync();
    expect(err?.errors['delivery.proof.handoffMethod']).toBeDefined();
  });
});

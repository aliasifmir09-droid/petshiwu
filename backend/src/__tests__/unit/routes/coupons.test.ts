import express from 'express';
import request from 'supertest';

const usages: Array<{ email: string; code: string; orderId?: string }> = [];

jest.mock('../../../models/CouponUsage', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(async (query: { email: string; code: string }) =>
      usages.find((row) => row.email === query.email && row.code === query.code) || null
    ),
    findOneAndUpdate: jest.fn(async (query: { email: string; code: string }, update: any) => {
      const existing = usages.find((row) => row.email === query.email && row.code === query.code);
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      usages.push({ ...query, ...update });
      return update;
    }),
  },
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import couponRoutes from '../../../routes/coupons';

const app = express();
app.use(express.json());
app.use('/api/v1/coupons', couponRoutes);

describe('coupon routes', () => {
  beforeEach(() => {
    usages.length = 0;
  });

  it('applies FAMILY15 at 15% with no dollar cap', async () => {
    const res = await request(app).post('/api/v1/coupons/validate').send({
      code: 'family15',
      subtotal: 200,
      email: 'family@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      valid: true,
      code: 'FAMILY15',
      discountAmount: 30,
    });
  });

  it('lets FAMILY15 be reused after a prior order on the same email', async () => {
    usages.push({ email: 'family@example.com', code: 'FAMILY15', orderId: 'order-1' });

    const res = await request(app).post('/api/v1/coupons/validate').send({
      code: 'FAMILY15',
      subtotal: 40,
      email: 'family@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discountAmount).toBe(6);
  });

  it('still locks one-use public codes after they have been used', async () => {
    usages.push({ email: 'guest@example.com', code: 'WELCOME10', orderId: 'order-1' });

    const res = await request(app).post('/api/v1/coupons/validate').send({
      code: 'WELCOME10',
      subtotal: 40,
      email: 'guest@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.message).toMatch(/already been used/i);
  });

  it('lets RESTOCK5 be reused after a prior reorder on the same email', async () => {
    usages.push({ email: 'repeat@example.com', code: 'RESTOCK5', orderId: 'order-1' });

    const res = await request(app).post('/api/v1/coupons/validate').send({
      code: 'RESTOCK5',
      subtotal: 200,
      email: 'repeat@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      valid: true,
      code: 'RESTOCK5',
      discountAmount: 10,
    });
  });

  it('lets RESTOCK7 be reused after a prior restock on the same email', async () => {
    usages.push({ email: 'repeat@example.com', code: 'RESTOCK7', orderId: 'order-1' });

    const res = await request(app).post('/api/v1/coupons/validate').send({
      code: 'RESTOCK7',
      subtotal: 200,
      email: 'repeat@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      valid: true,
      code: 'RESTOCK7',
      discountAmount: 10,
    });
  });

  it('does not record usage for RESTOCK7', async () => {
    const res = await request(app).post('/api/v1/coupons/use').send({
      code: 'RESTOCK7',
      email: 'repeat@example.com',
      orderId: 'order-2',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, reusable: true });
    expect(usages).toHaveLength(0);
  });

  it('does not record usage for FAMILY15', async () => {
    const res = await request(app).post('/api/v1/coupons/use').send({
      code: 'FAMILY15',
      email: 'family@example.com',
      orderId: 'order-2',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, reusable: true });
    expect(usages).toHaveLength(0);
  });
});

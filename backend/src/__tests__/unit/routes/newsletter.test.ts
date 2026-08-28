import express from 'express';
import request from 'supertest';

type Row = {
  email: string;
  source?: string;
  unsubscribed: boolean;
  unsubscribedAt?: Date;
  discountCodeSent?: boolean;
  ipAddress?: string;
  save: jest.Mock;
};

const store: Row[] = [];
const sendMock = jest.fn();

jest.mock('../../../models/Newsletter', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(async (query: { email: string }) => store.find((row) => row.email === query.email) || null),
    create: jest.fn(async (doc: any) => {
      const row: Row = {
        ...doc,
        unsubscribed: false,
        save: jest.fn(async function (this: Row) {
          return this;
        }),
      };
      store.push(row);
      return row;
    }),
    updateOne: jest.fn(async (query: { email: string }, update: any) => {
      const row = store.find((item) => item.email === query.email);
      if (row) Object.assign(row, update);
      return { acknowledged: true };
    }),
  },
}));

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: (...args: any[]) => sendMock(...args) },
  })),
}));

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import newsletterRoutes from '../../../routes/newsletter';

const app = express();
app.use(express.json());
app.use('/api/v1/newsletter', newsletterRoutes);

describe('newsletter routes', () => {
  const previousKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    store.length = 0;
    sendMock.mockReset();
    sendMock.mockResolvedValue({ id: 'email-1' });
    delete process.env.RESEND_API_KEY;
  });

  afterAll(() => {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
  });

  it('rejects an invalid email', async () => {
    const res = await request(app).post('/api/v1/newsletter/subscribe').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(store).toHaveLength(0);
  });

  it('saves a new subscriber and returns FREEDOM20 even without Resend', async () => {
    const res = await request(app)
      .post('/api/v1/newsletter/subscribe')
      .send({ email: 'maria@example.com', source: 'homepage' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      emailSent: false,
      code: 'FREEDOM20',
    });
    expect(res.body.message).toMatch(/FREEDOM20/);
    expect(store).toHaveLength(1);
    expect(store[0].email).toBe('maria@example.com');
    expect(store[0].source).toBe('homepage');
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('emails FREEDOM20 when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    const res = await request(app)
      .post('/api/v1/newsletter/subscribe')
      .send({ email: 'kevin@example.com', source: 'homepage' });

    expect(res.status).toBe(201);
    expect(res.body.emailSent).toBe(true);
    expect(res.body.code).toBe('FREEDOM20');
    expect(sendMock).toHaveBeenCalledTimes(1);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe('kevin@example.com');
    expect(payload.subject).toMatch(/FREEDOM20/);
    expect(payload.html).toContain('FREEDOM20');
    expect(payload.html).toContain('20% off your first order (max $10)');
    expect(payload.html).toContain('/unsubscribe?email=kevin%40example.com');
    expect(payload.html).not.toContain('WELCOME10');
  });

  it('returns FREEDOM20 for an already-subscribed address without creating a duplicate', async () => {
    store.push({
      email: 'sandra@example.com',
      source: 'homepage',
      unsubscribed: false,
      save: jest.fn(),
    });

    const res = await request(app)
      .post('/api/v1/newsletter/subscribe')
      .send({ email: 'Sandra@example.com', source: 'homepage' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      alreadySubscribed: true,
      code: 'FREEDOM20',
    });
    expect(store).toHaveLength(1);
  });

  it('unsubscribes via JSON when the shopper hits /unsubscribe', async () => {
    store.push({
      email: 'leave@example.com',
      unsubscribed: false,
      save: jest.fn(),
    });

    const res = await request(app)
      .get('/api/v1/newsletter/unsubscribe')
      .query({ email: 'leave@example.com' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(store[0].unsubscribed).toBe(true);
  });
});

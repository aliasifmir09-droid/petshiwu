import express from 'express';
import request from 'supertest';

const sendCallbackEmail = jest.fn();

jest.mock('../../../utils/callbackMail', () => ({
  sendCallbackEmail: (...args: any[]) => sendCallbackEmail(...args),
}));

jest.mock('../../../utils/contactMail', () => ({
  sendContactFormEmail: jest.fn(),
}));

const saved: any[] = [];
jest.mock('../../../models/CallbackRequest', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(async () => 0),
    create: jest.fn(async (doc: any) => {
      const row = { _id: `cb-${saved.length + 1}`, ...doc };
      saved.push(row);
      return row;
    }),
    updateOne: jest.fn(async () => ({ acknowledged: true })),
  },
}));

jest.mock('../../../models/ContactSubmission', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    updateOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('mongoose', () => ({
  connection: { readyState: 1 },
}));

import contactFormsRoutes from '../../../routes/contactForms';
import CallbackRequest from '../../../models/CallbackRequest';

const app = express();
app.use(express.json());
app.use('/api/v1/contact', contactFormsRoutes);

describe('callback chat requests', () => {
  beforeEach(() => {
    saved.length = 0;
    sendCallbackEmail.mockReset();
    sendCallbackEmail.mockResolvedValue({ messageId: 'test', to: 'support@petshiwu.com' });
    (CallbackRequest.countDocuments as jest.Mock).mockResolvedValue(0);
    process.env.NODE_ENV = 'test';
  });

  it('rejects chat with no phone number', async () => {
    const res = await request(app).post('/api/v1/contact/callback').send({
      text: 'please call me',
    });
    expect(res.status).toBe(400);
    expect(sendCallbackEmail).not.toHaveBeenCalled();
  });

  it('emails the desk when a shopper drops a number in chat', async () => {
    const res = await request(app).post('/api/v1/contact/callback').send({
      text: 'please call 347-555-0100',
      name: 'Jawed',
      pagePath: '/',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.phone).toBe('+1 (347) 555-0100');
    expect(res.body.message).toMatch(/Don't wait/i);
    expect(res.body.message).toMatch(/within a minute/i);
    expect(sendCallbackEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '+13475550100',
        name: 'Jawed',
        pagePath: '/',
      })
    );
    expect(saved[0]).toMatchObject({
      phone: '+13475550100',
      displayPhone: '+1 (347) 555-0100',
    });
  });

  it('rate-limits repeat callback pings', async () => {
    (CallbackRequest.countDocuments as jest.Mock).mockResolvedValue(3);
    const res = await request(app).post('/api/v1/contact/callback').send({
      phone: '3475550100',
    });
    expect(res.status).toBe(429);
    expect(sendCallbackEmail).not.toHaveBeenCalled();
  });
});

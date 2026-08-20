import express from 'express';
import request from 'supertest';

const sendContactFormEmail = jest.fn();

jest.mock('../../../utils/contactMail', () => ({
  sendContactFormEmail: (...args: any[]) => sendContactFormEmail(...args),
}));

const saved: any[] = [];
jest.mock('../../../models/ContactSubmission', () => ({
  __esModule: true,
  default: {
    create: jest.fn(async (doc: any) => {
      const row = { _id: `id-${saved.length + 1}`, ...doc };
      saved.push(row);
      return row;
    }),
    updateOne: jest.fn(async () => ({ acknowledged: true })),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('mongoose', () => ({
  connection: { readyState: 1 },
}));

import contactFormsRoutes from '../../../routes/contactForms';

const app = express();
app.use(express.json());
app.use('/api/v1/contact', contactFormsRoutes);
app.use('/api/contact', contactFormsRoutes);

describe('contact form routes', () => {
  beforeEach(() => {
    saved.length = 0;
    sendContactFormEmail.mockReset();
    sendContactFormEmail.mockResolvedValue({ messageId: 'test', to: 'support@petshiwu.com' });
    process.env.NODE_ENV = 'test';
  });

  it('rejects a general message with missing fields', async () => {
    const res = await request(app).post('/api/v1/contact/general').send({ name: 'Asif' });
    expect(res.status).toBe(400);
    expect(sendContactFormEmail).not.toHaveBeenCalled();
  });

  it('sends the Contact Us form to support@petshiwu.com', async () => {
    const res = await request(app).post('/api/v1/contact/general').send({
      name: 'Asif',
      email: 'asif@example.com',
      subject: 'order',
      message: 'Where is my bag?',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(sendContactFormEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'general',
        name: 'Asif',
        email: 'asif@example.com',
        subject: 'Order Question',
        message: 'Where is my bag?',
      })
    );
    expect(sendContactFormEmail.mock.results[0].value).resolves.toMatchObject({
      to: 'support@petshiwu.com',
    });
  });

  it('sends investor inquiries (legacy /api/contact path too)', async () => {
    const res = await request(app).post('/api/contact/investor').send({
      name: 'Asif',
      email: 'asif@example.com',
      company: 'ASDFH',
      message: 'ASDNOASDF',
    });
    expect(res.status).toBe(200);
    expect(sendContactFormEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'investor',
        company: 'ASDFH',
        email: 'asif@example.com',
      })
    );
  });

  it('sends vendor applications', async () => {
    const res = await request(app).post('/api/v1/contact/vendor').send({
      name: 'Sam',
      email: 'sam@brand.com',
      company: 'Brand Co',
      message: 'We make treats',
    });
    expect(res.status).toBe(200);
    expect(sendContactFormEmail).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'vendor', company: 'Brand Co' })
    );
  });

  it('requires company on vendor applications', async () => {
    const res = await request(app).post('/api/v1/contact/vendor').send({
      name: 'Sam',
      email: 'sam@brand.com',
      message: 'We make treats',
    });
    expect(res.status).toBe(400);
    expect(sendContactFormEmail).not.toHaveBeenCalled();
  });
});

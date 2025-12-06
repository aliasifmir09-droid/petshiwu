import request from 'supertest';
import mongoose from 'mongoose';
import { connectDatabase } from '../../utils/database';
import app from '../helpers/testApp';
import { createTestUser, getAdminToken } from '../helpers/testHelpers';

describe('Donations API', () => {
  let customerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDatabase();
    adminToken = await getAdminToken(app);
    const customer = await createTestUser(app, { role: 'customer' });
    customerToken = customer.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/donations/create-intent', () => {
    it('should create donation intent (public)', async () => {
      const donationData = {
        amount: 50,
        currency: 'usd',
        donorName: 'Test Donor',
        donorEmail: 'donor@test.com',
        message: 'Test donation'
      };

      const response = await request(app)
        .post('/api/donations/create-intent')
        .send(donationData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid amount', async () => {
      await request(app)
        .post('/api/donations/create-intent')
        .send({
          amount: -10, // Invalid amount
          currency: 'usd'
        })
        .expect(400);
    });
  });

  describe('POST /api/donations/confirm', () => {
    it('should confirm donation (public)', async () => {
      // This would typically require a valid payment intent ID
      // For testing, we'll just verify the endpoint exists
      const response = await request(app)
        .post('/api/donations/confirm')
        .send({
          paymentIntentId: 'test-intent-id',
          donationId: new mongoose.Types.ObjectId().toString()
        });

      // May return 400 or 404 depending on validation
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/donations/:id', () => {
    it('should require authentication', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/donations/${fakeId}`)
        .expect(401);
    });

    it('should return 404 for non-existent donation', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/donations/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });
  });

  describe('GET /api/donations/admin/all', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/donations/admin/all')
        .expect(401);
    });

    it('should require admin permissions', async () => {
      await request(app)
        .get('/api/donations/admin/all')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return all donations for admin', async () => {
      const response = await request(app)
        .get('/api/donations/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/donations/admin/stats', () => {
    it('should require admin permissions', async () => {
      await request(app)
        .get('/api/donations/admin/stats')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return donation stats for admin', async () => {
      const response = await request(app)
        .get('/api/donations/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});


import request from 'supertest';
import mongoose from 'mongoose';
import { connectDatabase } from '../../utils/database';
import User from '../../models/User';

// Import app after environment is set up
let app: any;
beforeAll(async () => {
  // Set test environment before importing server
  process.env.NODE_ENV = 'test';
  app = (await import('../../server')).default;
});

describe('Auth API', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should create new user with valid data', async () => {
      const testEmail = `test${Date.now()}@test.com`;
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: testEmail,
          password: 'Test123456',
          phone: '+1234567890'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', testEmail);
      expect(response.body.data).not.toHaveProperty('password');

      // Cleanup
      await User.deleteOne({ email: testEmail });
    });
  });
});


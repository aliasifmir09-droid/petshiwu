import request from 'supertest';
import mongoose from 'mongoose';
import { connectDatabase } from '../../utils/database';
import User from '../../models/User';
import app from '../helpers/testApp';

describe('Auth API', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
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

      // Registration now requires email verification, so no token is returned
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toContain('email');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(testEmail);
      expect(response.body.data.emailVerified).toBe(false);

      // Verify user was actually created in database
      const createdUser = await User.findOne({ email: testEmail });
      expect(createdUser).toBeDefined();
      expect(createdUser?.email).toBe(testEmail);
      expect(createdUser?.firstName).toBe('Test');
      expect(createdUser?.lastName).toBe('User');
      // Password should be hashed, not plain text
      expect(createdUser?.password).not.toBe('Test123456');

      // Cleanup
      await User.deleteOne({ email: testEmail });
    });
  });
});


import request from 'supertest';
import mongoose from 'mongoose';
import { connectDatabase } from '../../utils/database';
import app from '../helpers/testApp';
import { createTestUser, getAdminToken } from '../helpers/testHelpers';
import User from '../../models/User';
import Product from '../../models/Product';
import Category from '../../models/Category';

describe('Users API', () => {
  let adminToken: string;
  let customerToken: string;
  let testProduct: any;
  let testCategory: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDatabase();
    adminToken = await getAdminToken(app);
    const customer = await createTestUser(app, { role: 'customer' });
    customerToken = customer.token;

    // Create test category and product for wishlist tests
    testCategory = await Category.create({
      name: 'Test Category',
      slug: `test-cat-${Date.now()}`,
      petType: 'dog',
      level: 1,
      isActive: true
    });

    testProduct = await Product.create({
      name: 'Test Product',
      slug: `test-product-${Date.now()}`,
      description: 'Test description',
      brand: 'Test Brand',
      basePrice: 29.99,
      petType: 'dog',
      category: testCategory._id,
      isActive: true,
      inStock: true
    });
  });

  afterAll(async () => {
    await Product.deleteOne({ _id: testProduct._id });
    await Category.deleteOne({ _id: testCategory._id });
    await mongoose.connection.close();
  });

  describe('GET /api/users/me/permissions', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/users/me/permissions')
        .expect(401);
    });

    it('should return user permissions', async () => {
      const response = await request(app)
        .get('/api/users/me/permissions')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/users/staff', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/users/staff')
        .expect(401);
    });

    it('should require admin role', async () => {
      await request(app)
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return staff users for admin', async () => {
      const response = await request(app)
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/users/staff', () => {
    it('should require admin role', async () => {
      await request(app)
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          firstName: 'Staff',
          lastName: 'User',
          email: 'staff@test.com',
          password: 'Staff123456'
        })
        .expect(403);
    });

    it('should create staff user', async () => {
      const staffData = {
        firstName: 'Staff',
        lastName: 'User',
        email: `staff${Date.now()}@test.com`,
        password: 'Staff123456',
        phone: '+1234567890',
        permissions: {
          canManageProducts: true,
          canManageOrders: false
        }
      };

      const response = await request(app)
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(staffData.email);

      // Cleanup
      const userId = response.body.data._id?.toString() || response.body.data._id;
      if (userId) {
        await User.deleteOne({ _id: userId });
      }
    });
  });

  describe('GET /api/users/customers', () => {
    it('should require admin/staff permissions', async () => {
      await request(app)
        .get('/api/users/customers')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return customers for admin', async () => {
      const response = await request(app)
        .get('/api/users/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/users/wishlist', () => {
    it('should require authentication', async () => {
      await request(app)
        .post('/api/users/wishlist')
        .send({ productId: testProduct._id })
        .expect(401);
    });

    it('should add product to wishlist', async () => {
      const response = await request(app)
        .post('/api/users/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/users/wishlist', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/users/wishlist')
        .expect(401);
    });

    it('should return user wishlist', async () => {
      const response = await request(app)
        .get('/api/users/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/users/wishlist', () => {
    it('should require authentication', async () => {
      await request(app)
        .delete('/api/users/wishlist')
        .send({ productId: testProduct._id })
        .expect(401);
    });

    it('should remove product from wishlist', async () => {
      const response = await request(app)
        .delete('/api/users/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/users/database/stats', () => {
    it('should require admin role', async () => {
      await request(app)
        .get('/api/users/database/stats')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return database stats for admin', async () => {
      const response = await request(app)
        .get('/api/users/database/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});


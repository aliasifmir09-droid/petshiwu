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
    try {
      process.env.NODE_ENV = 'test';
      await connectDatabase();
      
      // Fix indexes before creating test data
      const { fixProductIndexes } = await import('../helpers/fixIndexes');
      await fixProductIndexes();
      
      try {
        adminToken = await getAdminToken(app);
        if (!adminToken) {
          throw new Error('Failed to get admin token');
        }
        console.log('✅ Admin token obtained');
      } catch (error: any) {
        console.error('❌ Failed to get admin token:', error.message);
        throw error;
      }

      try {
        const customer = await createTestUser(app, { role: 'customer' });
        customerToken = customer.token;
        if (!customerToken) {
          throw new Error('Failed to get customer token');
        }
        console.log('✅ Customer token obtained');
      } catch (error: any) {
        console.error('❌ Failed to create test user:', error.message);
        throw error;
      }

      // Create test category and product for wishlist tests with unique name
      const timestamp = Date.now();
      testCategory = await Category.create({
        name: `Test Category ${timestamp}`,
        slug: `test-cat-${timestamp}`,
        petType: 'dog',
        level: 1,
        isActive: true
      });

      const productTimestamp = Date.now();
      testProduct = await Product.create({
        name: `Test Product ${productTimestamp}`,
        slug: `test-product-${productTimestamp}`,
        description: 'Test description',
        brand: 'Test Brand',
        basePrice: 29.99,
        petType: 'dog',
        category: testCategory._id,
        isActive: true,
        inStock: true,
        variants: [], // Empty variants array to avoid SKU unique index issues
        images: ['https://example.com/image.jpg']
      });
      
      console.log('✅ beforeAll completed successfully');
    } catch (error: any) {
      console.error('❌ beforeAll failed:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  });

  afterAll(async () => {
    if (testProduct?._id) {
      await Product.deleteOne({ _id: testProduct._id });
    }
    if (testCategory?._id) {
      await Category.deleteOne({ _id: testCategory._id });
    }
    await mongoose.connection.close();
  });

  describe('GET /api/users/me/permissions', () => {
    it('should require authentication', async () => {
      let response: any;
      try {
        response = await request(app)
          .get('/api/users/me/permissions');
      } catch (error: any) {
        console.error('Request error:', error.message);
        throw error;
      }

      if (!response) {
        throw new Error('Response is undefined');
      }

      if (!response.status) {
        console.error('Response object:', JSON.stringify(response, null, 2));
        throw new Error('Response.status is undefined');
      }

      expect(response.status).toBe(401);
      if (response.body) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should return user permissions', async () => {
      const response = await request(app)
        .get('/api/users/me/permissions')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/users/staff', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/staff');

      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it('should return staff users for admin', async () => {
      const response = await request(app)
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/users/staff', () => {
    it('should require admin role', async () => {
      const response = await request(app)
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          firstName: 'Staff',
          lastName: 'User',
          email: 'staff@test.com',
          password: 'Staff123456'
        });

      expect(response.status).toBe(403);
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
        .send(staffData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(staffData.email);

      // Cleanup
      const userId = response.body.data._id?.toString() || response.body.data._id;
      if (userId) {
        await User.deleteOne({ _id: mongoose.Types.ObjectId.createFromHexString(userId.toString()) });
      }
    });
  });

  describe('GET /api/users/customers', () => {
    it('should require admin/staff permissions', async () => {
      const response = await request(app)
        .get('/api/users/customers')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it('should return customers for admin', async () => {
      const response = await request(app)
        .get('/api/users/customers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/users/wishlist', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/users/wishlist')
        .send({ productId: testProduct._id });

      expect(response.status).toBe(401);
    });

    it('should add product to wishlist', async () => {
      const response = await request(app)
        .post('/api/users/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct._id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/users/wishlist', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/wishlist');

      expect(response.status).toBe(401);
    });

    it('should return user wishlist', async () => {
      const response = await request(app)
        .get('/api/users/wishlist')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/users/wishlist', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/users/wishlist')
        .send({ productId: testProduct._id });

      expect(response.status).toBe(401);
    });

    it('should remove product from wishlist', async () => {
      const response = await request(app)
        .delete('/api/users/wishlist')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct._id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/users/database/stats', () => {
    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/users/database/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it('should return database stats for admin', async () => {
      const response = await request(app)
        .get('/api/users/database/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});

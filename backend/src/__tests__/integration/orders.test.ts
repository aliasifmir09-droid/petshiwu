import request from 'supertest';
import mongoose from 'mongoose';
import { connectDatabase } from '../../utils/database';
import app from '../helpers/testApp';
import { createTestUser, getAdminToken } from '../helpers/testHelpers';
import Order from '../../models/Order';
import Product from '../../models/Product';
import Category from '../../models/Category';

describe('Orders API', () => {
  let customerToken: string;
  let adminToken: string;
  let testProduct: any;
  let testCategory: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDatabase();
    
    adminToken = await getAdminToken(app);
    const customer = await createTestUser(app, { role: 'customer' });
    customerToken = customer.token;

    // Create test category with unique name
    const timestamp = Date.now();
    testCategory = await Category.create({
      name: `Test Category ${timestamp}`,
      slug: `test-cat-${timestamp}`,
      petType: 'dog',
      level: 1,
      isActive: true
    });

    // Create test product with unique slug
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
      inStock: true
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testProduct?._id) {
      await Product.deleteOne({ _id: testProduct._id });
    }
    if (testCategory?._id) {
      await Category.deleteOne({ _id: testCategory._id });
    }
    await mongoose.connection.close();
  });

  describe('POST /api/orders', () => {
    it('should require authentication', async () => {
      await request(app)
        .post('/api/orders')
        .send({
          items: [{ product: testProduct._id, quantity: 1 }]
        })
        .expect(401);
    });

    it('should create order with valid data', async () => {
      const orderData = {
        items: [
          {
            product: testProduct._id.toString(),
            quantity: 2,
            price: testProduct.basePrice
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA'
        },
        paymentMethod: 'card'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items.length).toBe(1);

      // Cleanup
      await Order.deleteOne({ _id: response.body.data._id });
    });

    it('should return 400 for invalid order data', async () => {
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: []
        })
        .expect(400);
    });
  });

  describe('GET /api/orders/myorders', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/orders/myorders')
        .expect(401);
    });

    it('should return user orders', async () => {
      const response = await request(app)
        .get('/api/orders/myorders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/orders/myorders?page=1&limit=10')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should require authentication', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/orders/${fakeId}`)
        .expect(401);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });
  });

  describe('GET /api/orders/track/:id', () => {
    it('should track order without authentication', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/orders/track/${fakeId}`)
        .expect(404); // Order doesn't exist, but endpoint is accessible
    });
  });

  describe('GET /api/orders/all', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/orders/all')
        .expect(401);
    });

    it('should require admin permissions', async () => {
      await request(app)
        .get('/api/orders/all')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return all orders for admin', async () => {
      const response = await request(app)
        .get('/api/orders/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PUT /api/orders/:id/cancel', () => {
    it('should require authentication', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/orders/${fakeId}/cancel`)
        .expect(401);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should require admin permissions', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/orders/${fakeId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'shipped' })
        .expect(403);
    });
  });

  describe('GET /api/orders/stats', () => {
    it('should require admin permissions', async () => {
      await request(app)
        .get('/api/orders/stats')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return stats for admin', async () => {
      const response = await request(app)
        .get('/api/orders/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});


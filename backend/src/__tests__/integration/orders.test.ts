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
    
    // Fix indexes before creating test data
    const { fixProductIndexes } = await import('../helpers/fixIndexes');
    await fixProductIndexes();
    
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

    // Create test product with unique slug (no variants to avoid SKU index issues)
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
      if (!testProduct?._id) {
        throw new Error('Test product not created');
      }
      // Send minimal valid data structure - protect middleware should run before validation
      const response = await request(app)
        .post('/api/orders')
        .send({
          items: [{
            product: testProduct._id.toString(),
            name: testProduct.name,
            image: testProduct.images?.[0] || 'https://example.com/image.jpg',
            quantity: 1,
            price: testProduct.basePrice
          }],
          shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'USA',
            phone: '+1234567890'
          },
          paymentMethod: 'credit_card',
          itemsPrice: testProduct.basePrice,
          shippingPrice: 5.99,
          taxPrice: 2.50,
          totalPrice: testProduct.basePrice + 5.99 + 2.50
        });
      
      // Log for debugging
      if (response.status !== 401) {
        console.log('Unexpected status:', response.status);
        console.log('Response body:', JSON.stringify(response.body, null, 2));
      }
      
      // Protect middleware should return 401 before validation runs
      expect(response.status).toBe(401);
      if (response.body) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should create order with valid data', async () => {
      const orderData = {
        items: [
          {
            product: testProduct._id.toString(),
            name: testProduct.name,
            image: testProduct.images?.[0] || 'https://example.com/image.jpg',
            quantity: 2,
            price: testProduct.basePrice
          }
        ],
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
          phone: '+1234567890'
        },
        paymentMethod: 'credit_card',
        itemsPrice: testProduct.basePrice * 2,
        shippingPrice: 5.99,
        taxPrice: 2.50,
        totalPrice: (testProduct.basePrice * 2) + 5.99 + 2.50
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items.length).toBe(1);

      // Cleanup
      if (response.body.data?._id) {
        await Order.deleteOne({ _id: response.body.data._id });
      }
    });

    it('should return 400 for invalid order data', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: []
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/orders/myorders', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/orders/myorders');

      expect(response.status).toBe(401);
    });

    it('should return user orders', async () => {
      const response = await request(app)
        .get('/api/orders/myorders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/orders/myorders?page=1&limit=10')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should require authentication', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/orders/${fakeId}`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/orders/track/:id', () => {
    it('should track order without authentication', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/orders/track/${fakeId}`);

      // Order doesn't exist, but endpoint is accessible
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/orders/all', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/orders/all');

      expect(response.status).toBe(401);
    });

    it('should require admin permissions', async () => {
      const response = await request(app)
        .get('/api/orders/all')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it('should return all orders for admin', async () => {
      const response = await request(app)
        .get('/api/orders/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PUT /api/orders/:id/cancel', () => {
    it('should require authentication', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/orders/${fakeId}/cancel`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should require admin permissions', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/orders/${fakeId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'shipped' });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/orders/stats', () => {
    it('should require admin permissions', async () => {
      const response = await request(app)
        .get('/api/orders/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it('should return stats for admin', async () => {
      const response = await request(app)
        .get('/api/orders/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});

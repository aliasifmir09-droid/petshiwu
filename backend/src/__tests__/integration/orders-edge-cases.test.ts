import request from 'supertest';
import mongoose from 'mongoose';
import { connectDatabase } from '../../utils/database';
import app from '../helpers/testApp';
import { getAdminToken, createTestUser } from '../helpers/testHelpers';
import Product from '../../models/Product';
import Order from '../../models/Order';
import User from '../../models/User';
import Category from '../../models/Category';

describe('Order Creation Edge Cases', () => {
  let adminToken: string;
  let userToken: string;
  let testUserId: string;
  let testProductId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDatabase();
    
    adminToken = await getAdminToken(app);
    const user = await createTestUser(app);
    userToken = user.token;
    testUserId = (user.user._id as mongoose.Types.ObjectId).toString();

    // Create test category
    const category = await Category.create({
      name: `Test Category ${Date.now()}`,
      slug: `test-category-${Date.now()}`,
      petType: 'dog',
      level: 1,
      position: 1,
      isActive: true
    });
    testCategoryId = (category._id as mongoose.Types.ObjectId).toString();

    // Create test product with stock
    const product = await Product.create({
      name: `Test Product ${Date.now()}`,
      slug: `test-product-${Date.now()}`,
      description: 'Test product',
      brand: 'Test Brand',
      basePrice: 10.99,
      petType: 'dog',
      category: testCategoryId,
      isActive: true,
      inStock: true,
      totalStock: 5,
      variants: []
    });
    testProductId = (product._id as mongoose.Types.ObjectId).toString();
  });

  afterAll(async () => {
    if (testProductId) await Product.findByIdAndDelete(testProductId);
    if (testCategoryId) await Category.findByIdAndDelete(testCategoryId);
    if (testUserId) await User.findByIdAndDelete(testUserId);
    await mongoose.connection.close();
  });

  describe('Stock Race Conditions', () => {
    it('should handle concurrent order creation with limited stock', async () => {
      // Create product with only 2 items in stock
      const limitedProduct = await Product.create({
        name: `Limited Stock Product ${Date.now()}`,
        slug: `limited-product-${Date.now()}`,
        description: 'Limited stock',
        brand: 'Test',
        basePrice: 10,
        petType: 'dog',
        category: testCategoryId,
        isActive: true,
        inStock: true,
        totalStock: 2,
        variants: []
      });

      const productId = (limitedProduct._id as mongoose.Types.ObjectId).toString();

      // Create two orders simultaneously requesting 2 items each
      const order1 = request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{
            product: productId,
            quantity: 2,
            price: 10,
            name: 'Limited Stock Product'
          }],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890'
          },
          paymentMethod: 'credit_card',
          itemsPrice: 20,
          shippingPrice: 5,
          taxPrice: 2,
          totalPrice: 27
        });

      const order2 = request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{
            product: productId,
            quantity: 2,
            price: 10,
            name: 'Limited Stock Product'
          }],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890'
          },
          paymentMethod: 'credit_card',
          itemsPrice: 20,
          shippingPrice: 5,
          taxPrice: 2,
          totalPrice: 27
        });

      const [response1, response2] = await Promise.all([order1, order2]);

      // One should succeed, one should fail
      const successCount = [response1, response2].filter(r => r.status === 201).length;
      const failCount = [response1, response2].filter(r => r.status === 400).length;

      expect(successCount).toBe(1);
      expect(failCount).toBe(1);

      // Verify stock was correctly updated
      const updatedProduct = await Product.findById(productId);
      expect(updatedProduct?.totalStock).toBe(0);

      // Cleanup
      await Product.findByIdAndDelete(productId);
      await Order.deleteMany({ 'items.product': productId });
    });
  });

  describe('Invalid Quantities', () => {
    it('should reject order with zero quantity', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{
            product: testProductId,
            quantity: 0,
            price: 10.99,
            name: 'Test Product'
          }],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890'
          },
          paymentMethod: 'credit_card',
          itemsPrice: 0,
          shippingPrice: 5,
          taxPrice: 0,
          totalPrice: 5
        });

      expect(response.status).toBe(400);
    });

    it('should reject order with negative quantity', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{
            product: testProductId,
            quantity: -1,
            price: 10.99,
            name: 'Test Product'
          }],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890'
          },
          paymentMethod: 'credit_card',
          itemsPrice: -10.99,
          shippingPrice: 5,
          taxPrice: 0,
          totalPrice: -5.99
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Insufficient Stock', () => {
    it('should reject order when quantity exceeds available stock', async () => {
      // Product has 5 items, request 10
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{
            product: testProductId,
            quantity: 10,
            price: 10.99,
            name: 'Test Product',
            image: 'test.jpg'
          }],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890'
          },
          paymentMethod: 'credit_card',
          itemsPrice: 109.90,
          shippingPrice: 5,
          taxPrice: 5.50,
          totalPrice: 120.40
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should reject order for out of stock product', async () => {
      const outOfStockProduct = await Product.create({
        name: `Out of Stock ${Date.now()}`,
        slug: `out-of-stock-${Date.now()}`,
        description: 'Out of stock',
        brand: 'Test',
        basePrice: 10,
        petType: 'dog',
        category: testCategoryId,
        isActive: true,
        inStock: false,
        totalStock: 0,
        variants: []
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{
            product: outOfStockProduct._id.toString(),
            quantity: 1,
            price: 10,
            name: 'Out of Stock',
            image: 'test.jpg'
          }],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890'
          },
          paymentMethod: 'credit_card',
          itemsPrice: 10,
          shippingPrice: 5,
          taxPrice: 0.50,
          totalPrice: 15.50
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('out of stock');

      await Product.findByIdAndDelete(outOfStockProduct._id);
    });
  });

  describe('Invalid Product IDs', () => {
    it('should reject order with non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{
            product: fakeId,
            quantity: 1,
            price: 10.99,
            name: 'Non-existent Product',
            image: 'test.jpg'
          }],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890'
          },
          paymentMethod: 'credit_card',
          itemsPrice: 10.99,
          shippingPrice: 5,
          taxPrice: 0.55,
          totalPrice: 16.54
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not found');
    });

    it('should reject order with invalid product ID format', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{
            product: 'invalid-id-format',
            quantity: 1,
            price: 10.99,
            name: 'Test',
            image: 'test.jpg'
          }],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890'
          },
          paymentMethod: 'credit_card',
          itemsPrice: 10.99,
          shippingPrice: 5,
          taxPrice: 0.55,
          totalPrice: 16.54
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Missing Required Fields', () => {
    it('should reject order without items', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890'
          },
          paymentMethod: 'credit_card',
          itemsPrice: 0,
          shippingPrice: 5,
          taxPrice: 0,
          totalPrice: 5
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('No order items');
    });

    it('should reject order with incomplete shipping address', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{
            product: testProductId,
            quantity: 1,
            price: 10.99,
            name: 'Test Product',
            image: 'test.jpg'
          }],
          shippingAddress: {
            street: '123 Test St',
            // Missing city, state, zipCode
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890'
          },
          paymentMethod: 'credit_card',
          itemsPrice: 10.99,
          shippingPrice: 5,
          taxPrice: 0.55,
          totalPrice: 16.54
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('incomplete');
    });
  });
});


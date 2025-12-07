import request from 'supertest';
import mongoose from 'mongoose';
import Product from '../../models/Product';
import Order from '../../models/Order';
import User from '../../models/User';
import Category from '../../models/Category';
import { testApp } from '../helpers/testApp';
import { getAdminToken, createTestUser, cleanupTestData } from '../helpers/testHelpers';

describe('Stock Management', () => {
  let adminToken: string;
  let userToken: string;
  let testUserId: string;
  let testProductId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    const user = await createTestUser();
    userToken = user.token;
    testUserId = user.userId;

    // Create test category
    const category = await Category.create({
      name: `Test Category ${Date.now()}`,
      slug: `test-category-${Date.now()}`,
      petType: 'dog',
      level: 1,
      position: 1,
      isActive: true
    });
    testCategoryId = category._id.toString();
  });

  afterAll(async () => {
    await cleanupTestData([
      { model: Category, _id: testCategoryId },
      { model: User, _id: testUserId }
    ]);
    await mongoose.connection.close();
  });

  describe('Stock Restoration on Order Cancellation', () => {
    it('should restore stock when order is cancelled', async () => {
      // Create product with initial stock
      const product = await Product.create({
        name: `Stock Test Product ${Date.now()}`,
        slug: `stock-test-${Date.now()}`,
        description: 'Stock test',
        brand: 'Test',
        basePrice: 10,
        petType: 'dog',
        category: testCategoryId,
        isActive: true,
        inStock: true,
        totalStock: 10,
        variants: []
      });

      const productId = product._id.toString();
      const initialStock = product.totalStock;

      // Create order
      const orderResponse = await request(testApp)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{
            product: productId,
            quantity: 3,
            price: 10,
            name: 'Stock Test Product',
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
          itemsPrice: 30,
          shippingPrice: 5,
          taxPrice: 1.50,
          totalPrice: 36.50
        });

      expect(orderResponse.status).toBe(201);
      const orderId = orderResponse.body.data._id;

      // Verify stock was reduced
      const afterOrderProduct = await Product.findById(productId);
      expect(afterOrderProduct?.totalStock).toBe(initialStock - 3);

      // Cancel order
      const cancelResponse = await request(testApp)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Changed mind' });

      expect(cancelResponse.status).toBe(200);

      // Verify stock was restored
      const afterCancelProduct = await Product.findById(productId);
      expect(afterCancelProduct?.totalStock).toBe(initialStock);

      // Cleanup
      await Product.findByIdAndDelete(productId);
      await Order.findByIdAndDelete(orderId);
    });

    it('should not restore stock if cancellation window expired', async () => {
      const product = await Product.create({
        name: `Expired Cancel Test ${Date.now()}`,
        slug: `expired-cancel-${Date.now()}`,
        description: 'Test',
        brand: 'Test',
        basePrice: 10,
        petType: 'dog',
        category: testCategoryId,
        isActive: true,
        inStock: true,
        totalStock: 10,
        variants: []
      });

      const productId = product._id.toString();

      // Create order
      const orderResponse = await request(testApp)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{
            product: productId,
            quantity: 2,
            price: 10,
            name: 'Expired Cancel Test',
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
          itemsPrice: 20,
          shippingPrice: 5,
          taxPrice: 1,
          totalPrice: 26
        });

      const orderId = orderResponse.body.data._id;

      // Manually set order creation time to 25 hours ago
      await Order.findByIdAndUpdate(orderId, {
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000)
      });

      // Try to cancel (should fail)
      const cancelResponse = await request(testApp)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Too late' });

      expect(cancelResponse.status).toBe(400);
      expect(cancelResponse.body.message).toContain('Cancellation window');

      // Stock should remain reduced
      const productAfter = await Product.findById(productId);
      expect(productAfter?.totalStock).toBe(8);

      // Cleanup
      await Product.findByIdAndDelete(productId);
      await Order.findByIdAndDelete(orderId);
    });
  });

  describe('Concurrent Stock Updates', () => {
    it('should handle multiple simultaneous stock updates correctly', async () => {
      const product = await Product.create({
        name: `Concurrent Test ${Date.now()}`,
        slug: `concurrent-${Date.now()}`,
        description: 'Test',
        brand: 'Test',
        basePrice: 10,
        petType: 'dog',
        category: testCategoryId,
        isActive: true,
        inStock: true,
        totalStock: 10,
        variants: []
      });

      const productId = product._id.toString();

      // Create multiple orders simultaneously
      const orders = Array(3).fill(null).map(() =>
        request(testApp)
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            items: [{
              product: productId,
              quantity: 2,
              price: 10,
              name: 'Concurrent Test',
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
            itemsPrice: 20,
            shippingPrice: 5,
            taxPrice: 1,
            totalPrice: 26
          })
      );

      const responses = await Promise.all(orders);
      const successfulOrders = responses.filter(r => r.status === 201);
      const failedOrders = responses.filter(r => r.status === 400);

      // At least one should succeed, but not all 3 (only 10 items available, 2 per order)
      expect(successfulOrders.length).toBeGreaterThan(0);
      expect(successfulOrders.length + failedOrders.length).toBe(3);

      // Verify final stock is correct
      const finalProduct = await Product.findById(productId);
      const expectedStock = 10 - (successfulOrders.length * 2);
      expect(finalProduct?.totalStock).toBe(expectedStock);

      // Cleanup
      await Product.findByIdAndDelete(productId);
      const orderIds = successfulOrders.map(r => r.body.data._id);
      await Order.deleteMany({ _id: { $in: orderIds } });
    });
  });

  describe('Low Stock Threshold', () => {
    it('should correctly identify low stock products', async () => {
      // Create product with low stock
      const lowStockProduct = await Product.create({
        name: `Low Stock Test ${Date.now()}`,
        slug: `low-stock-${Date.now()}`,
        description: 'Test',
        brand: 'Test',
        basePrice: 10,
        petType: 'dog',
        category: testCategoryId,
        isActive: true,
        inStock: true,
        totalStock: 3,
        lowStockThreshold: 5,
        variants: []
      });

      const productId = lowStockProduct._id.toString();

      // Get low stock products (admin endpoint)
      const response = await request(testApp)
        .get('/api/inventory-alerts/low-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ globalThreshold: 5 });

      expect(response.status).toBe(200);
      expect(response.body.products).toBeDefined();
      const productIds = response.body.products.map((p: any) => p._id.toString());
      expect(productIds).toContain(productId);

      // Cleanup
      await Product.findByIdAndDelete(productId);
    });
  });
});


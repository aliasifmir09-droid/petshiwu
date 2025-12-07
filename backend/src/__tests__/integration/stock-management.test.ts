import request from 'supertest';
import mongoose from 'mongoose';
import { connectDatabase } from '../../utils/database';
import app from '../helpers/testApp';
import { getAdminToken, createTestUser } from '../helpers/testHelpers';
import Product from '../../models/Product';
import Order from '../../models/Order';
import User from '../../models/User';
import Category from '../../models/Category';

describe('Stock Management', () => {
  let adminToken: string;
  let userToken: string;
  let testUserId: string;
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
  });

  afterAll(async () => {
    if (testCategoryId) await Category.findByIdAndDelete(testCategoryId);
    if (testUserId) await User.findByIdAndDelete(testUserId);
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

      const productId = (product._id as mongoose.Types.ObjectId).toString();
      const initialStock = product.totalStock;

      // Create order
      const orderResponse = await request(app)
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
      const orderId = orderResponse.body.data._id?.toString() || orderResponse.body.data._id;

      // Verify stock was reduced
      const afterOrderProduct = await Product.findById(productId);
      expect(afterOrderProduct?.totalStock).toBe(initialStock - 3);

      // Cancel order
      const cancelResponse = await request(app)
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

      const productId = (product._id as mongoose.Types.ObjectId).toString();

      // Create order
      const orderResponse = await request(app)
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

      const orderId = orderResponse.body.data._id?.toString() || orderResponse.body.data._id;

      // Manually set order creation time to 25 hours ago
      await Order.findByIdAndUpdate(new mongoose.Types.ObjectId(orderId), {
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000)
      });

      // Try to cancel (should fail)
      const cancelResponse = await request(app)
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

      const productId = (product._id as mongoose.Types.ObjectId).toString();

      // Create multiple orders simultaneously
      const orders = Array(3).fill(null).map(() =>
        request(app)
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
      const orderIds = successfulOrders.map(r => {
        const id = r.body.data?._id;
        if (!id) return null;
        return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : (id.toString ? new mongoose.Types.ObjectId(id.toString()) : id);
      }).filter((id): id is mongoose.Types.ObjectId => id !== null);
      if (orderIds.length > 0) {
        await Order.deleteMany({ _id: { $in: orderIds } });
      }
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

      const productId = (lowStockProduct._id as mongoose.Types.ObjectId).toString();

      // Get low stock products (admin endpoint)
      const response = await request(app)
        .get('/api/inventory-alerts/low-stock?globalThreshold=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.products).toBeDefined();
      const productIds = response.body.products.map((p: any) => {
        const id = p._id;
        return id?.toString ? id.toString() : String(id);
      });
      expect(productIds).toContain(productId);

      // Cleanup
      await Product.findByIdAndDelete(productId);
    });
  });
});


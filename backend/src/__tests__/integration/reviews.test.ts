import request from 'supertest';
import mongoose from 'mongoose';
import { connectDatabase } from '../../utils/database';
import app from '../helpers/testApp';
import { createTestUser } from '../helpers/testHelpers';
import Review from '../../models/Review';
import Product from '../../models/Product';
import Category from '../../models/Category';

describe('Reviews API', () => {
  let customerToken: string;
  let testProduct: any;
  let testCategory: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDatabase();
    
    const customer = await createTestUser(app, { role: 'customer' });
    customerToken = customer.token;

    // Create test category
    testCategory = await Category.create({
      name: 'Test Category',
      slug: `test-cat-${Date.now()}`,
      petType: 'dog',
      level: 1,
      isActive: true
    });

    // Create test product
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
    // Cleanup
    await Review.deleteMany({ product: testProduct._id });
    await Product.deleteOne({ _id: testProduct._id });
    await Category.deleteOne({ _id: testCategory._id });
    await mongoose.connection.close();
  });

  describe('GET /api/reviews/product/:productId', () => {
    it('should return reviews for a product (public)', async () => {
      const response = await request(app)
        .get(`/api/reviews/product/${testProduct._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/reviews/product/${testProduct._id}?page=1&limit=10`)
        .expect(200);

      expect(response.body.pagination).toBeDefined();
    });

    it('should return 400 for invalid product ID', async () => {
      await request(app)
        .get('/api/reviews/product/invalid-id')
        .expect(400);
    });
  });

  describe('POST /api/reviews', () => {
    it('should require authentication', async () => {
      await request(app)
        .post('/api/reviews')
        .send({
          product: testProduct._id,
          rating: 5,
          comment: 'Great product!'
        })
        .expect(401);
    });

    it('should create review with valid data', async () => {
      const reviewData = {
        product: testProduct._id.toString(),
        rating: 5,
        comment: 'Excellent product!'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(5);
      expect(response.body.data.comment).toBe(reviewData.comment);

      // Cleanup
      const reviewId = response.body.data._id?.toString() || response.body.data._id;
      if (reviewId) {
        await Review.deleteOne({ _id: reviewId });
      }
    });

    it('should return 400 for invalid rating', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          product: testProduct._id,
          rating: 6, // Invalid: should be 1-5
          comment: 'Test'
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          rating: 5
          // Missing product and comment
        })
        .expect(400);
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('should require authentication', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/reviews/${fakeId}`)
        .send({
          comment: 'Updated comment'
        })
        .expect(401);
    });

    it('should update review', async () => {
      // Create a review first
      const review = await Review.create({
        product: testProduct._id,
        user: (await mongoose.connection.db?.collection('users').findOne({}))?._id || new mongoose.Types.ObjectId(),
        rating: 4,
        comment: 'Original comment'
      });

      const response = await request(app)
        .put(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          comment: 'Updated comment',
          rating: 5
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Cleanup
      await Review.deleteOne({ _id: review._id });
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should require authentication', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/reviews/${fakeId}`)
        .expect(401);
    });
  });
});


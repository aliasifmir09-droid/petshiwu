import request from 'supertest';
import mongoose from 'mongoose';
import { connectDatabase } from '../../utils/database';
import app from '../helpers/testApp';
import { createTestUser, getAdminToken } from '../helpers/testHelpers';
import Category from '../../models/Category';

describe('Categories API', () => {
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDatabase();
    adminToken = await getAdminToken(app);
    const customer = await createTestUser(app, { role: 'customer' });
    customerToken = customer.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/categories', () => {
    it('should return all categories (public)', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by petType', async () => {
      const response = await request(app)
        .get('/api/categories?petType=dog')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach((cat: any) => {
          expect(cat.petType).toBe('dog');
        });
      }
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/categories/${fakeId}`)
        .expect(404);
    });

    it('should return category by ID if exists', async () => {
      // Create a test category
      const category = await Category.create({
        name: 'Test Category',
        slug: `test-category-${Date.now()}`,
        petType: 'dog',
        level: 1,
        isActive: true
      });

      const response = await request(app)
        .get(`/api/categories/${category._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(category._id.toString());

      // Cleanup
      await Category.deleteOne({ _id: category._id });
    });
  });

  describe('GET /api/categories/admin/all', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/categories/admin/all')
        .expect(401);
    });

    it('should require admin permissions', async () => {
      await request(app)
        .get('/api/categories/admin/all')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return all categories for admin', async () => {
      const response = await request(app)
        .get('/api/categories/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/categories', () => {
    it('should require authentication', async () => {
      await request(app)
        .post('/api/categories')
        .send({
          name: 'New Category',
          petType: 'dog',
          level: 1
        })
        .expect(401);
    });

    it('should require admin permissions', async () => {
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'New Category',
          petType: 'dog',
          level: 1
        })
        .expect(403);
    });

    it('should create category with valid data', async () => {
      const categoryData = {
        name: `Test Category ${Date.now()}`,
        petType: 'dog',
        level: 1,
        description: 'Test description'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(categoryData.name);
      expect(response.body.data.petType).toBe('dog');

      // Cleanup
      const categoryId = response.body.data._id?.toString() || response.body.data._id;
      if (categoryId) {
        await Category.deleteOne({ _id: categoryId });
      }
    });

    it('should return 400 for missing required fields', async () => {
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Category'
        })
        .expect(400);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update category', async () => {
      // Create category
      const category = await Category.create({
        name: 'Original Name',
        slug: `original-${Date.now()}`,
        petType: 'dog',
        level: 1,
        isActive: true
      });

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');

      // Cleanup
      await Category.deleteOne({ _id: category._id });
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete category', async () => {
      // Create category
      const category = await Category.create({
        name: 'To Delete',
        slug: `delete-${Date.now()}`,
        petType: 'dog',
        level: 1,
        isActive: true
      });

      await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deleted
      const deleted = await Category.findById(category._id);
      expect(deleted).toBeNull();
    });
  });
});


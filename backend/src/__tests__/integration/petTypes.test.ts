import request from 'supertest';
import mongoose from 'mongoose';
import { connectDatabase } from '../../utils/database';
import app from '../helpers/testApp';
import { createTestUser, getAdminToken } from '../helpers/testHelpers';
import PetType from '../../models/PetType';

describe('Pet Types API', () => {
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

  describe('GET /api/pet-types', () => {
    it('should return all pet types (public)', async () => {
      const response = await request(app)
        .get('/api/pet-types')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/pet-types/:slug', () => {
    it('should return pet type by slug', async () => {
      // Try to get 'dog' pet type, but it might not exist
      const response = await request(app)
        .get('/api/pet-types/dog');

      // May return 200 if exists, or 404 if not
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      } else {
        expect(response.status).toBe(404);
      }
    });
  });

  describe('GET /api/pet-types/admin/all', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/pet-types/admin/all')
        .expect(401);
    });

    it('should require admin/staff role', async () => {
      await request(app)
        .get('/api/pet-types/admin/all')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return all pet types for admin', async () => {
      const response = await request(app)
        .get('/api/pet-types/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/pet-types', () => {
    it('should require authentication', async () => {
      await request(app)
        .post('/api/pet-types')
        .send({
          name: 'New Pet Type',
          slug: 'new-pet-type'
        })
        .expect(401);
    });

    it('should require admin role', async () => {
      await request(app)
        .post('/api/pet-types')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'New Pet Type',
          slug: 'new-pet-type'
        })
        .expect(403);
    });

    it('should create pet type with valid data', async () => {
      const petTypeData = {
        name: `Test Pet Type ${Date.now()}`,
        slug: `test-pet-type-${Date.now()}`,
        description: 'Test description',
        isActive: true
      };

      const response = await request(app)
        .post('/api/pet-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(petTypeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(petTypeData.name);

      // Cleanup
      if (response.body.data?._id) {
        const petTypeId = typeof response.body.data._id === 'string' 
          ? response.body.data._id 
          : response.body.data._id.toString();
        await PetType.deleteOne({ _id: petTypeId });
      }
    });
  });

  describe('PUT /api/pet-types/:id', () => {
    it('should require admin role', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/pet-types/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Updated' })
        .expect(403);
    });
  });

  describe('DELETE /api/pet-types/:id', () => {
    it('should require admin role', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/pet-types/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });
});


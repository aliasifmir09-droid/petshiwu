import request from 'supertest';
import { Application } from 'express';
import User from '../../models/User';
import mongoose from 'mongoose';

/**
 * Helper to create and login as a test user
 */
export const createTestUser = async (app: Application, userData?: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'customer' | 'admin' | 'staff';
}) => {
  const testEmail = userData?.email || `test${Date.now()}@test.com`;
  const password = userData?.password || 'Test123456';
  
  // Create user
  const user = await User.create({
    firstName: userData?.firstName || 'Test',
    lastName: userData?.lastName || 'User',
    email: testEmail,
    password: password,
    phone: '+1234567890',
    role: userData?.role || 'customer'
  });

  // Login to get token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: testEmail,
      password: password
    });

  return {
    user,
    token: loginResponse.body.token,
    email: testEmail,
    password: password
  };
};

/**
 * Helper to get admin token
 */
export const getAdminToken = async (app: Application) => {
  // Try to find existing admin
  let admin = await User.findOne({ role: 'admin' });
  
  if (!admin) {
    // Create admin if doesn't exist
    admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: `admin${Date.now()}@test.com`,
      password: 'Admin123456',
      role: 'admin',
      phone: '+1234567890'
    });
  }

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: admin.email,
      password: 'Admin123456'
    });

  return loginResponse.body.token;
};

/**
 * Cleanup test data
 */
export const cleanupTestData = async (collection: string, filter: any) => {
  const db = mongoose.connection.db;
  if (db) {
    await db.collection(collection).deleteMany(filter);
  }
};


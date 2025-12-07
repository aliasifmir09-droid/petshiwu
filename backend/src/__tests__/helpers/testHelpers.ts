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
  
  // Create user with email verified for tests
  const user = await User.create({
    firstName: userData?.firstName || 'Test',
    lastName: userData?.lastName || 'User',
    email: testEmail,
    password: password,
    phone: '+1234567890',
    role: userData?.role || 'customer',
    emailVerified: true // Mark as verified for tests
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
  const testAdminEmail = 'test-admin@test.com';
  const testAdminPassword = 'Admin123456';
  
  // Try to find existing test admin
  let admin = await User.findOne({ 
    email: testAdminEmail,
    role: 'admin' 
  });
  
  if (!admin) {
    // Create test admin if doesn't exist
    try {
      admin = await User.create({
        firstName: 'Test',
        lastName: 'Admin',
        email: testAdminEmail,
        password: testAdminPassword,
        role: 'admin',
        phone: '+1234567890',
        emailVerified: true // Mark as verified for tests
      });
    } catch (error: any) {
      throw new Error(`Failed to create admin: ${error.message}`);
    }
  } else {
    // If admin exists, delete and recreate to ensure correct password
    await User.deleteOne({ _id: admin._id });
    admin = await User.create({
      firstName: 'Test',
      lastName: 'Admin',
      email: testAdminEmail,
      password: testAdminPassword,
      role: 'admin',
      phone: '+1234567890',
      emailVerified: true // Mark as verified for tests
    });
  }

  // Login to get token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: testAdminEmail,
      password: testAdminPassword
    });

  if (loginResponse.status !== 200) {
    throw new Error(`Login failed with status ${loginResponse.status}`);
  }

  if (!loginResponse.body.token) {
    throw new Error(`No token in login response`);
  }

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


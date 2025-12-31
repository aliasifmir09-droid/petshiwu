import mongoose from 'mongoose';
import User from '../models/User';
import { connectDatabase } from '../utils/database';
import logger from '../utils/logger';

/**
 * Creates an admin user in the database
 * Uses ADMIN_PASSWORD environment variable if set, otherwise defaults to 'admin123'
 */
const createAdminUser = async () => {
  try {
    await connectDatabase();
    logger.info('Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@petshiwu.com' });
    
    if (existingAdmin) {
      logger.info('✓ Admin user already exists');
      logger.info(`Email: ${existingAdmin.email}`);
      logger.info(`Role: ${existingAdmin.role}`);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user (password will be hashed by the User model pre-save hook)
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@petshiwu.com',
      password: adminPassword,
      role: 'admin',
      phone: '+1234567890',
      addresses: []
    });

    logger.info('\n✅ Admin user created successfully!');
    logger.info('═══════════════════════════════════');
    logger.info(`Email: ${admin.email}`);
    // NEVER log passwords - security risk
    if (!process.env.ADMIN_PASSWORD) {
      logger.warn('⚠️  WARNING: Using default password. Set ADMIN_PASSWORD env var for production!');
    }
    logger.info(`Role: ${admin.role}`);
    logger.info('═══════════════════════════════════');
    logger.info('\nYou can now login to the admin dashboard at:');
    logger.info('http://localhost:5174');

    await mongoose.connection.close();
    logger.info('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error creating admin user:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdminUser();


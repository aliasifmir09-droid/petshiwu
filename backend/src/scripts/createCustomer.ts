import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from '../utils/database';
import User from '../models/User';
import logger from '../utils/logger';

dotenv.config();

/**
 * Creates a test customer user in the database
 * Used for development and testing purposes
 */
const createCustomer = async () => {
  try {
    await connectDatabase();

    const email = 'customer@test.com';
    
    // Check if customer already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      logger.info('✅ Test customer already exists!');
      logger.info('\n📧 Login Credentials:');
      logger.info('   Email: customer@test.com');
      logger.info('\n🌐 Login at: http://localhost:5173/login\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create new customer
    const customer = await User.create({
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@test.com',
      password: 'password123',
      phone: '+1-800-123-4567',
      role: 'customer'
    });

    logger.info('✅ Test customer created successfully!\n');
    logger.info('📧 Login Credentials:');
    logger.info('   Email: customer@test.com');
    logger.info('\n👤 Customer Details:');
    logger.info(`   Name: ${customer.firstName} ${customer.lastName}`);
    logger.info(`   Email: ${customer.email}`);
    logger.info(`   Phone: ${customer.phone}`);
    logger.info(`   Role: ${customer.role}`);
    logger.info('\n🌐 Login at: http://localhost:5173/login\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error creating customer:', error);
    process.exit(1);
  }
};

createCustomer();











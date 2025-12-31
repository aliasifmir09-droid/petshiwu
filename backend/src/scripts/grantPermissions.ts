import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { connectDatabase } from '../utils/database';
import logger from '../utils/logger';

dotenv.config();

/**
 * Grants all permissions to a staff or admin user
 * @param email - The email address of the user to grant permissions to
 */
const grantPermissions = async (email: string) => {
  try {
    await connectDatabase();

    const user = await User.findOne({ email });

    if (!user) {
      logger.error(`User with email ${email} not found`);
      process.exit(1);
    }

    if (user.role === 'customer') {
      logger.error('Cannot grant permissions to a customer account. User must be admin or staff.');
      process.exit(1);
    }

    // Grant all permissions
    user.permissions = {
      canManageProducts: true,
      canManageOrders: true,
      canManageCategories: true,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageCustomers: true,
      canManageSettings: true
    };

    await user.save();

    logger.info(`✅ All permissions granted to ${user.firstName} ${user.lastName} (${email})`);
    logger.info(`Permissions: ${JSON.stringify(user.permissions)}`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Error granting permissions:', error);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  logger.info('Usage: npm run grant-permissions <email>');
  logger.info('Example: npm run grant-permissions staff@example.com');
  process.exit(1);
}

grantPermissions(email);


import mongoose from 'mongoose';
import User from '../models/User';
import { connectDatabase } from '../utils/database';
import logger from '../utils/logger';

/**
 * Fixes admin permissions for a user
 * Ensures they have all required permissions to manage orders and see the admin dashboard
 */
const fixAdminPermissions = async () => {
  try {
    await connectDatabase();
    logger.info('Connected to database');

    // Find the admin user (Pet's account) - update to correct email if needed
    const adminUser = await User.findOne({ email: 'petchiwu@gmail.com' });
    
    if (!adminUser) {
      logger.error('Admin user not found with email: petchiwu@gmail.com');
      logger.info('Checking for any admin users...');
      const allAdmins = await User.find({ role: 'admin' });
      logger.info(`Found ${allAdmins.length} admin user(s):`);
      allAdmins.forEach(admin => {
        logger.info(`  - ${admin.email} (${admin.firstName} ${admin.lastName})`);
      });
      await mongoose.connection.close();
      process.exit(1);
    }

    logger.info(`\nFound user: ${adminUser.firstName} ${adminUser.lastName}`);
    logger.info(`Current role: ${adminUser.role}`);
    logger.info(`Current permissions:`, adminUser.permissions || {});

    // Ensure user is admin
    const wasAdmin = adminUser.role === 'admin';
    if (adminUser.role !== 'admin') {
      adminUser.role = 'admin';
      logger.info('Updating role to: admin');
    }

    // Grant all permissions
    adminUser.permissions = {
      canManageProducts: true,
      canManageOrders: true,
      canManageCustomers: true,
      canManageCategories: true,
      canViewAnalytics: true,
      canManageUsers: true,
      canManageSettings: true
    };

    await adminUser.save();

    logger.info('\n✅ Admin permissions updated successfully!');
    logger.info('═══════════════════════════════════');
    logger.info(`Email: ${adminUser.email}`);
    logger.info(`Role: ${adminUser.role}`);
    logger.info(`Permissions:`, adminUser.permissions);
    logger.info('═══════════════════════════════════');
    logger.info('\nYou can now view orders in the admin dashboard');

    await mongoose.connection.close();
    logger.info('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error updating admin permissions:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

fixAdminPermissions();

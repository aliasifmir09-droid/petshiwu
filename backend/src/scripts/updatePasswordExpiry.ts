import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { connectDatabase } from '../utils/database';
import logger from '../utils/logger';

dotenv.config();

/**
 * Migration script to set password expiry dates for existing admin and staff users
 * This should be run once after implementing the password expiry feature
 */
const updatePasswordExpiry = async () => {
  try {
    logger.info('🔄 Connecting to database...');
    await connectDatabase();

    logger.info('🔍 Finding admin and staff users without password expiry dates...');
    
    // Find all admin and staff users who don't have passwordChangedAt set
    const users = await User.find({
      role: { $in: ['admin', 'staff'] },
      passwordChangedAt: { $exists: false }
    });

    if (users.length === 0) {
      logger.info('✅ All admin and staff users already have password expiry dates set.');
      process.exit(0);
    }

    logger.info(`📝 Found ${users.length} user(s) to update:`);
    users.forEach(user => {
      logger.info(`   - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
    });

    logger.info('\n🔧 Updating users...');
    
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    let updated = 0;
    for (const user of users) {
      user.passwordChangedAt = now;
      user.passwordExpiresAt = expiresAt;
      await user.save({ validateBeforeSave: false }); // Skip validation to avoid triggering password hash
      updated++;
      logger.info(`   ✓ Updated ${user.email}`);
    }

    logger.info(`\n✅ Successfully updated ${updated} user(s)`);
    logger.info(`📅 Password expiry date set to: ${expiresAt.toLocaleDateString()}`);
    logger.warn('\n⚠️  Note: Users will need to change their password within 30 days.');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error updating password expiry:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  updatePasswordExpiry();
}

export default updatePasswordExpiry;


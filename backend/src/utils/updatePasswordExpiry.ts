import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { connectDatabase } from './database';

dotenv.config();

/**
 * Migration script to set password expiry dates for existing admin and staff users
 * This should be run once after implementing the password expiry feature
 */
const updatePasswordExpiry = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDatabase();

    console.log('🔍 Finding admin and staff users without password expiry dates...');
    
    // Find all admin and staff users who don't have passwordChangedAt set
    const users = await User.find({
      role: { $in: ['admin', 'staff'] },
      passwordChangedAt: { $exists: false }
    });

    if (users.length === 0) {
      console.log('✅ All admin and staff users already have password expiry dates set.');
      process.exit(0);
    }

    console.log(`📝 Found ${users.length} user(s) to update:`);
    users.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
    });

    console.log('\n🔧 Updating users...');
    
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    let updated = 0;
    for (const user of users) {
      user.passwordChangedAt = now;
      user.passwordExpiresAt = expiresAt;
      await user.save({ validateBeforeSave: false }); // Skip validation to avoid triggering password hash
      updated++;
      console.log(`   ✓ Updated ${user.email}`);
    }

    console.log(`\n✅ Successfully updated ${updated} user(s)`);
    console.log(`📅 Password expiry date set to: ${expiresAt.toLocaleDateString()}`);
    console.log('\n⚠️  Note: Users will need to change their password within 30 days.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating password expiry:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  updatePasswordExpiry();
}

export default updatePasswordExpiry;


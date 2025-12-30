import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import { safeToString } from '../utils/types';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Script to fix email addresses by adding dots back
 * Usage: ts-node src/utils/fixEmail.ts <oldEmail> <newEmail>
 * Example: ts-node src/utils/fixEmail.ts mirmurtazacoc@gmail.com mirmurtaza.coc@gmail.com
 */
const fixEmail = async () => {
  try {
    // Get email addresses from command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.error('❌ Usage: ts-node src/utils/fixEmail.ts <oldEmail> <newEmail>');
      console.error('   Example: ts-node src/utils/fixEmail.ts mirmurtazacoc@gmail.com mirmurtaza.coc@gmail.com');
      process.exit(1);
    }

    const oldEmail = args[0].toLowerCase().trim();
    const newEmail = args[1].toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(oldEmail) || !emailRegex.test(newEmail)) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI is not set in environment variables');
      process.exit(1);
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find user with old email
    const user = await User.findOne({ email: oldEmail });
    
    if (!user) {
      console.error(`❌ User with email "${oldEmail}" not found`);
      await mongoose.disconnect();
      process.exit(1);
    }

    // Check if new email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && safeToString(existingUser._id) !== safeToString(user._id)) {
      console.error(`❌ Email "${newEmail}" is already in use by another user`);
      await mongoose.disconnect();
      process.exit(1);
    }

    // Update email
    console.log(`\n📝 Updating email for user: ${user.firstName} ${user.lastName}`);
    console.log(`   Old email: ${user.email}`);
    console.log(`   New email: ${newEmail}`);

    user.email = newEmail;
    await user.save();

    console.log('\n✅ Email updated successfully!');
    console.log(`   User ID: ${user._id}`);
    console.log(`   New email: ${user.email}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - email already exists');
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

// Run the script
fixEmail();


import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { connectDatabase } from '../utils/database';

dotenv.config();

// Grant all permissions to a staff user
const grantPermissions = async (email: string) => {
  try {
    await connectDatabase();

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    if (user.role === 'customer') {
      console.error('Cannot grant permissions to a customer account. User must be admin or staff.');
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

    console.log(`✅ All permissions granted to ${user.firstName} ${user.lastName} (${email})`);
    console.log('Permissions:', user.permissions);
    
    process.exit(0);
  } catch (error) {
    console.error('Error granting permissions:', error);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: npm run grant-permissions <email>');
  console.log('Example: npm run grant-permissions staff@example.com');
  process.exit(1);
}

grantPermissions(email);


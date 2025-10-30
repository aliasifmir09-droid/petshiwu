import mongoose from 'mongoose';
import User from '../models/User';
import { connectDatabase } from './database';

const createAdminUser = async () => {
  try {
    await connectDatabase();
    console.log('Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@petshiwu.com' });
    
    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user (password will be hashed by the User model pre-save hook)
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@petshiwu.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1234567890',
      addresses: []
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('═══════════════════════════════════');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('Role:', admin.role);
    console.log('═══════════════════════════════════');
    console.log('\nYou can now login to the admin dashboard at:');
    console.log('http://localhost:5174');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdminUser();


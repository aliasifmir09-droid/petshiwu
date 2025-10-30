import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from './database';
import User from '../models/User';

dotenv.config();

const createCustomer = async () => {
  try {
    await connectDatabase();

    const email = 'customer@test.com';
    
    // Check if customer already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('✅ Test customer already exists!');
      console.log('\n📧 Login Credentials:');
      console.log('   Email: customer@test.com');
      console.log('   Password: password123');
      console.log('\n🌐 Login at: http://localhost:5173/login\n');
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

    console.log('✅ Test customer created successfully!\n');
    console.log('📧 Login Credentials:');
    console.log('   Email: customer@test.com');
    console.log('   Password: password123');
    console.log('\n👤 Customer Details:');
    console.log(`   Name: ${customer.firstName} ${customer.lastName}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Phone: ${customer.phone}`);
    console.log(`   Role: ${customer.role}`);
    console.log('\n🌐 Login at: http://localhost:5173/login\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    process.exit(1);
  }
};

createCustomer();





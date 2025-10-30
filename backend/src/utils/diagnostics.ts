import mongoose from 'mongoose';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import { connectDatabase } from './database';

const runDiagnostics = async () => {
  try {
    console.log('🔍 Running System Diagnostics...\n');
    
    await connectDatabase();
    console.log('✅ Database connection: SUCCESS');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('');

    // Check Users
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const customerUsers = await User.countDocuments({ role: 'customer' });
    
    console.log('👥 Users:');
    console.log('   Total:', totalUsers);
    console.log('   Admins:', adminUsers);
    console.log('   Customers:', customerUsers);
    
    if (adminUsers > 0) {
      const admins = await User.find({ role: 'admin' }).select('email firstName lastName');
      console.log('   Admin accounts:');
      admins.forEach(admin => {
        console.log(`     - ${admin.email} (${admin.firstName} ${admin.lastName})`);
      });
    } else {
      console.log('   ⚠️  WARNING: No admin users found!');
      console.log('   Run: node -r ts-node/register src/utils/createAdmin.ts');
    }
    console.log('');

    // Check Categories
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    
    console.log('📁 Categories:');
    console.log('   Total:', totalCategories);
    console.log('   Active:', activeCategories);
    
    if (totalCategories === 0) {
      console.log('   ⚠️  WARNING: No categories found!');
      console.log('   Go to Admin Dashboard → Categories → Seed Default Categories');
    }
    console.log('');

    // Check Products
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const inStockProducts = await Product.countDocuments({ inStock: true });
    
    console.log('📦 Products:');
    console.log('   Total:', totalProducts);
    console.log('   Active:', activeProducts);
    console.log('   In Stock:', inStockProducts);
    console.log('');

    // Check Environment
    console.log('⚙️  Environment:');
    console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('   PORT:', process.env.PORT || '5000 (default)');
    console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ NOT SET');
    console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ NOT SET');
    console.log('');

    // Summary
    console.log('═══════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════');
    
    const issues = [];
    if (adminUsers === 0) issues.push('No admin users');
    if (totalCategories === 0) issues.push('No categories');
    if (!process.env.JWT_SECRET) issues.push('JWT_SECRET not set');
    if (!process.env.MONGODB_URI) issues.push('MONGODB_URI not set');
    
    if (issues.length === 0) {
      console.log('✅ All systems operational!');
    } else {
      console.log('⚠️  Issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('');
      console.log('🔧 Fixes:');
      if (adminUsers === 0) {
        console.log('   1. Create admin: node -r ts-node/register src/utils/createAdmin.ts');
      }
      if (totalCategories === 0) {
        console.log('   2. Seed categories: Login to admin dashboard → Categories → Seed');
      }
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Diagnostics complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running diagnostics:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runDiagnostics();


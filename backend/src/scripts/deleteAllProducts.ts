import mongoose from 'mongoose';
import Product from '../models/Product';
import { connectDatabase } from '../utils/database';
import dotenv from 'dotenv';
import * as readline from 'readline';

// Load environment variables
dotenv.config();

/**
 * Deletes all products from the database
 * WARNING: This is a destructive operation that cannot be undone!
 */
const deleteAllProducts = async () => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  WARNING: DESTRUCTIVE OPERATION ⚠️');
    console.log('='.repeat(60));
    console.log('This script will DELETE ALL PRODUCTS from the database.');
    console.log('This action CANNOT be undone!\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to MongoDB\n');

    // Count existing products
    const productCount = await Product.countDocuments({});
    console.log(`📦 Found ${productCount} products in the database\n`);

    if (productCount === 0) {
      console.log('ℹ️  No products to delete. Database is already empty.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Show a few example product names
    const sampleProducts = await Product.find({}).limit(5).select('name').lean();
    if (sampleProducts.length > 0) {
      console.log('📋 Sample products that will be deleted:');
      sampleProducts.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.name}`);
      });
      if (productCount > 5) {
        console.log(`   ... and ${productCount - 5} more products\n`);
      } else {
        console.log('');
      }
    }

    // Confirmation prompt
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question('⚠️  Type "DELETE ALL" (in all caps) to confirm deletion: ', (input) => {
        rl.close();
        resolve(input);
      });
    });

    if (answer !== 'DELETE ALL') {
      console.log('\n❌ Deletion cancelled. Products were NOT deleted.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n🗑️  Deleting all products...\n');
    
    // Delete all products
    const result = await Product.deleteMany({});
    
    console.log('='.repeat(60));
    console.log('📊 Deletion Summary:');
    console.log(`   ✅ Deleted: ${result.deletedCount} products`);
    console.log('='.repeat(60) + '\n');

    // Verify deletion
    const remainingCount = await Product.countDocuments({});
    if (remainingCount === 0) {
      console.log('✅ Success! All products have been deleted from the database.\n');
    } else {
      console.log(`⚠️  Warning: ${remainingCount} products still remain in the database.\n`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    
    return {
      success: true,
      deleted: result.deletedCount,
      remaining: remainingCount
    };
  } catch (error: any) {
    console.error('❌ Deletion failed:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  deleteAllProducts()
    .then(() => {
      console.log('✅ Operation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Operation failed:', error);
      process.exit(1);
    });
}

export default deleteAllProducts;

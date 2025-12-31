import mongoose from 'mongoose';
import Product from '../models/Product';
import { connectDatabase } from '../utils/database';
import dotenv from 'dotenv';
import * as readline from 'readline';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Deletes all products from the database
 * WARNING: This is a destructive operation that cannot be undone!
 */
const deleteAllProducts = async () => {
  try {
    logger.info('\n' + '='.repeat(60));
    logger.info('⚠️  WARNING: DESTRUCTIVE OPERATION ⚠️');
    logger.info('='.repeat(60));
    logger.info('This script will DELETE ALL PRODUCTS from the database.');
    logger.info('This action CANNOT be undone!\n');

    // Connect to database
    await connectDatabase();
    logger.info('✅ Connected to MongoDB\n');

    // Count existing products
    const productCount = await Product.countDocuments({});
    logger.info(`📦 Found ${productCount} products in the database\n`);

    if (productCount === 0) {
      logger.info('ℹ️  No products to delete. Database is already empty.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Show a few example product names
    const sampleProducts = await Product.find({}).limit(5).select('name').lean();
    if (sampleProducts.length > 0) {
      logger.info('📋 Sample products that will be deleted:');
      sampleProducts.forEach((p, idx) => {
        logger.info(`   ${idx + 1}. ${p.name}`);
      });
      if (productCount > 5) {
        logger.info(`   ... and ${productCount - 5} more products\n`);
      } else {
        logger.info('');
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
      logger.info('\n❌ Deletion cancelled. Products were NOT deleted.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    logger.info('\n🗑️  Deleting all products...\n');
    
    // Delete all products
    const result = await Product.deleteMany({});
    
    logger.info('='.repeat(60));
    logger.info('📊 Deletion Summary:');
    logger.info(`   ✅ Deleted: ${result.deletedCount} products`);
    logger.info('='.repeat(60) + '\n');

    // Verify deletion
    const remainingCount = await Product.countDocuments({});
    if (remainingCount === 0) {
      logger.info('✅ Success! All products have been deleted from the database.\n');
    } else {
      logger.info(`⚠️  Warning: ${remainingCount} products still remain in the database.\n`);
    }

    // Close connection
    await mongoose.connection.close();
    logger.info('✅ Database connection closed\n');
    
    return {
      success: true,
      deleted: result.deletedCount,
      remaining: remainingCount
    };
  } catch (error: any) {
    logger.error('❌ Deletion failed:', error.message);
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
      logger.info('✅ Operation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n❌ Operation failed:', error);
      process.exit(1);
    });
}

export default deleteAllProducts;

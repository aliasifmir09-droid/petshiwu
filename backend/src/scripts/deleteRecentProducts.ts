import mongoose from 'mongoose';
import Product from '../models/Product';
import { connectDatabase } from '../utils/database';
import dotenv from 'dotenv';
import * as readline from 'readline';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Deletes products uploaded within a specified time period
 * Usage: npm run script:delete-recent-products
 */
const deleteRecentProducts = async () => {
  try {
    logger.info('\n' + '='.repeat(60));
    logger.info('🗑️  Delete Recently Uploaded Products');
    logger.info('='.repeat(60) + '\n');

    // Connect to database
    await connectDatabase();
    logger.info('✅ Connected to MongoDB\n');

    // Create readline interface for user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Ask for number of days
    const daysInput = await new Promise<string>((resolve) => {
      rl.question('📅 How many days back should we delete products from? (e.g., 1 for last 24 hours, 7 for last week): ', (input) => {
        resolve(input.trim());
      });
    });

    const days = parseInt(daysInput, 10);
    if (isNaN(days) || days <= 0) {
      logger.error('❌ Invalid input. Please enter a positive number.');
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    cutoffDate.setHours(0, 0, 0, 0); // Start of that day

    logger.info(`\n📊 Looking for products created after: ${cutoffDate.toLocaleString()}\n`);

    // Find products created after the cutoff date
    const recentProducts = await Product.find({
      createdAt: { $gte: cutoffDate },
      deletedAt: null // Only non-deleted products
    })
      .select('name slug createdAt brand category')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const productCount = recentProducts.length;

    if (productCount === 0) {
      logger.info('ℹ️  No products found in the specified time period.');
      rl.close();
      await mongoose.connection.close();
      process.exit(0);
    }

    logger.info(`📦 Found ${productCount} product(s) created in the last ${days} day(s):\n`);

    // Show preview of products that will be deleted
    logger.info('📋 Products that will be deleted:');
    logger.info('-'.repeat(60));
    recentProducts.forEach((product, idx) => {
      const categoryName = (product.category as any)?.name || 'N/A';
      const createdDate = new Date(product.createdAt).toLocaleString();
      logger.info(`   ${idx + 1}. ${product.name}`);
      logger.info(`      Brand: ${product.brand} | Category: ${categoryName}`);
      logger.info(`      Created: ${createdDate}`);
      logger.info(`      Slug: ${product.slug}\n`);
    });
    logger.info('-'.repeat(60) + '\n');

    // Confirmation prompt
    const answer = await new Promise<string>((resolve) => {
      rl.question(`⚠️  Are you sure you want to delete these ${productCount} product(s)? Type "YES" to confirm: `, (input) => {
        rl.close();
        resolve(input.trim());
      });
    });

    if (answer !== 'YES') {
      logger.info('\n❌ Deletion cancelled. Products were NOT deleted.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    logger.info('\n🗑️  Deleting products...\n');
    
    // Delete products
    const result = await Product.deleteMany({
      createdAt: { $gte: cutoffDate },
      deletedAt: null
    });
    
    logger.info('='.repeat(60));
    logger.info('📊 Deletion Summary:');
    logger.info(`   ✅ Deleted: ${result.deletedCount} product(s)`);
    logger.info(`   📅 Time period: Last ${days} day(s)`);
    logger.info(`   📅 Cutoff date: ${cutoffDate.toLocaleString()}`);
    logger.info('='.repeat(60) + '\n');

    // Verify deletion
    const remainingCount = await Product.countDocuments({
      createdAt: { $gte: cutoffDate },
      deletedAt: null
    });
    
    if (remainingCount === 0) {
      logger.info('✅ Success! All products from the specified period have been deleted.\n');
    } else {
      logger.info(`⚠️  Warning: ${remainingCount} product(s) still remain in the specified period.\n`);
    }

    // Show total products remaining
    const totalRemaining = await Product.countDocuments({ deletedAt: null });
    logger.info(`📦 Total products remaining in database: ${totalRemaining}\n`);

    // Close connection
    await mongoose.connection.close();
    logger.info('✅ Database connection closed\n');
    
    return {
      success: true,
      deleted: result.deletedCount,
      remaining: remainingCount,
      totalRemaining: totalRemaining
    };
  } catch (error: any) {
    logger.error('❌ Deletion failed:', error.message);
    logger.error(error.stack);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  deleteRecentProducts()
    .then(() => {
      logger.info('✅ Operation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n❌ Operation failed:', error);
      process.exit(1);
    });
}

export default deleteRecentProducts;


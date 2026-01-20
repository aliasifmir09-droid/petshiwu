import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';
import { connectDatabase } from '../utils/database';
import dotenv from 'dotenv';
import * as readline from 'readline';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Deletes recent products that were added to the wrong category or petType
 * Usage: npm run script:delete-recent-by-category
 */
const deleteRecentProductsByCategory = async () => {
  try {
    logger.info('\n' + '='.repeat(60));
    logger.info('🗑️  Delete Recent Products by Category/PetType');
    logger.info('='.repeat(60) + '\n');

    // Connect to database
    await connectDatabase();
    logger.info('✅ Connected to MongoDB\n');

    // Create readline interface for user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Ask for number of hours
    const hoursInput = await new Promise<string>((resolve) => {
      rl.question('⏰ How many hours back should we check? (e.g., 8, 12, 24, 48): ', (input) => {
        resolve(input.trim());
      });
    });

    const hours = parseFloat(hoursInput);
    if (isNaN(hours) || hours <= 0) {
      logger.error('❌ Invalid input. Please enter a positive number.');
      rl.close();
      await mongoose.connection.close();
      process.exit(1);
    }

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setTime(cutoffDate.getTime() - (hours * 60 * 60 * 1000));

    logger.info(`\n📊 Looking for products created after: ${cutoffDate.toLocaleString()}\n`);

    // Find recent products with category and petType info
    const recentProducts = await Product.find({
      createdAt: { $gte: cutoffDate }
    })
      .select('name slug createdAt brand category petType')
      .populate('category', 'name slug petType')
      .sort({ createdAt: -1 })
      .lean();

    if (recentProducts.length === 0) {
      logger.info('ℹ️  No products found in the specified time period.');
      rl.close();
      await mongoose.connection.close();
      process.exit(0);
    }

    logger.info(`📦 Found ${recentProducts.length} product(s) created in the last ${hours} hour(s):\n`);

    // Show all products with their category and petType
    logger.info('📋 Recent Products:');
    logger.info('-'.repeat(80));
    
    const productsWithMismatch: any[] = [];
    
    recentProducts.forEach((product, idx) => {
      const category = product.category as any;
      const categoryName = category?.name || 'N/A';
      const categoryPetType = category?.petType || 'N/A';
      const productPetType = product.petType || 'N/A';
      const createdDate = new Date(product.createdAt).toLocaleString();
      
      // Check if there's a mismatch between product petType and category petType
      const hasMismatch = categoryPetType !== 'N/A' && 
                         productPetType.toLowerCase() !== categoryPetType.toLowerCase();
      
      const mismatchIndicator = hasMismatch ? ' ⚠️  MISMATCH' : '';
      
      logger.info(`   ${idx + 1}. ${product.name}`);
      logger.info(`      Brand: ${product.brand}`);
      logger.info(`      Product PetType: ${productPetType} | Category PetType: ${categoryPetType}${mismatchIndicator}`);
      logger.info(`      Category: ${categoryName}`);
      logger.info(`      Created: ${createdDate}`);
      logger.info(`      Slug: ${product.slug}\n`);
      
      if (hasMismatch) {
        productsWithMismatch.push(product);
      }
    });
    
    logger.info('-'.repeat(80) + '\n');

    // Ask what to delete
    if (productsWithMismatch.length > 0) {
      logger.info(`⚠️  Found ${productsWithMismatch.length} product(s) with category/petType mismatch!\n`);
    }

    const deleteOption = await new Promise<string>((resolve) => {
      rl.question('What would you like to delete?\n  1. All recent products\n  2. Only products with category/petType mismatch\n  3. Cancel\nChoose (1/2/3): ', (input) => {
        resolve(input.trim());
      });
    });

    let productsToDelete: any[] = [];
    let deleteQuery: any = {
      createdAt: { $gte: cutoffDate }
    };

    if (deleteOption === '1') {
      productsToDelete = recentProducts;
      logger.info(`\n🗑️  Will delete ALL ${recentProducts.length} recent product(s)...\n`);
    } else if (deleteOption === '2') {
      if (productsWithMismatch.length === 0) {
        logger.info('\nℹ️  No products with mismatch found. Nothing to delete.\n');
        rl.close();
        await mongoose.connection.close();
        process.exit(0);
      }
      
      // Find products where product petType doesn't match category petType
      const categoryIds = productsWithMismatch
        .map((p: any) => p.category?._id || p.category)
        .filter((id: any) => id && mongoose.Types.ObjectId.isValid(id));
      
      // Get all categories to check their petTypes
      const categories = await Category.find({
        _id: { $in: categoryIds }
      }).select('_id petType').lean();
      
      const categoryMap = new Map(
        categories.map((c: any) => [c._id.toString(), c.petType])
      );
      
      // Build query for products with mismatch
      const productIdsWithMismatch = productsWithMismatch
        .filter((p: any) => {
          const categoryId = p.category?._id || p.category;
          if (!categoryId) return false;
          const categoryPetType = categoryMap.get(categoryId.toString());
          const productPetType = p.petType?.toLowerCase();
          return categoryPetType && productPetType && 
                 categoryPetType.toLowerCase() !== productPetType.toLowerCase();
        })
        .map((p: any) => p._id);
      
      if (productIdsWithMismatch.length === 0) {
        logger.info('\nℹ️  Could not identify products with mismatch. Nothing to delete.\n');
        rl.close();
        await mongoose.connection.close();
        process.exit(0);
      }
      
      deleteQuery._id = { $in: productIdsWithMismatch };
      productsToDelete = productsWithMismatch;
      logger.info(`\n🗑️  Will delete ${productIdsWithMismatch.length} product(s) with category/petType mismatch...\n`);
    } else {
      logger.info('\n❌ Deletion cancelled.\n');
      rl.close();
      await mongoose.connection.close();
      process.exit(0);
    }

    // Show preview
    logger.info('📋 Products that will be deleted:');
    logger.info('-'.repeat(60));
    productsToDelete.forEach((product, idx) => {
      const category = product.category as any;
      const categoryName = category?.name || 'N/A';
      logger.info(`   ${idx + 1}. ${product.name} (${product.petType} | ${categoryName})`);
    });
    logger.info('-'.repeat(60) + '\n');

    // Confirmation
    const confirmAnswer = await new Promise<string>((resolve) => {
      rl.question(`⚠️  Are you sure you want to delete these ${productsToDelete.length} product(s)? Type "YES" to confirm: `, (input) => {
        rl.close();
        resolve(input.trim());
      });
    });

    if (confirmAnswer !== 'YES') {
      logger.info('\n❌ Deletion cancelled. Products were NOT deleted.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    logger.info('\n🗑️  Deleting products...\n');
    
    // Delete products
    const result = await Product.deleteMany(deleteQuery);
    
    logger.info('='.repeat(60));
    logger.info('📊 Deletion Summary:');
    logger.info(`   ✅ Deleted: ${result.deletedCount} product(s)`);
    logger.info(`   ⏰ Time period: Last ${hours} hour(s)`);
    logger.info(`   📅 Cutoff date: ${cutoffDate.toLocaleString()}`);
    logger.info('='.repeat(60) + '\n');

    // Verify deletion
    const remainingCount = await Product.countDocuments(deleteQuery);
    
    if (remainingCount === 0) {
      logger.info('✅ Success! All selected products have been deleted.\n');
    } else {
      logger.info(`⚠️  Warning: ${remainingCount} product(s) still remain.\n`);
    }

    // Show total products remaining
    const totalRemaining = await Product.countDocuments({});
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
  deleteRecentProductsByCategory()
    .then(() => {
      logger.info('✅ Operation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n❌ Operation failed:', error);
      process.exit(1);
    });
}

export default deleteRecentProductsByCategory;

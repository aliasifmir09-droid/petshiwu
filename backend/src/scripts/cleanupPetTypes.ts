import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';
import { connectDatabase } from '../utils/database';
import logger from '../utils/logger';

/**
 * Database Cleanup Script - Remove Pet Types except Dog & Cat
 * 
 * This script will:
 * 1. Delete all products with petType: bird, fish, small-pet, or reptile
 * 2. Delete all categories with petType: bird, fish, small-pet, or reptile
 * 3. Keep products and categories with petType: dog or cat
 */

const cleanupPetTypes = async () => {
  try {
    logger.info('🧹 Starting pet type cleanup...\n');
    
    await connectDatabase();
    logger.info('✅ Connected to database\n');

    // Pet types to remove
    const petTypesToRemove = ['bird', 'fish', 'small-pet', 'reptile'];

    // 1. Clean up Products
    logger.info('📦 Cleaning up Products...');
    const productsToDelete = await Product.find({ 
      petType: { $in: petTypesToRemove } 
    });
    
    logger.info(`   Found ${productsToDelete.length} products to delete:`);
    productsToDelete.forEach(p => {
      logger.info(`   - ${p.name} (${p.petType})`);
    });

    if (productsToDelete.length > 0) {
      const productResult = await Product.deleteMany({ 
        petType: { $in: petTypesToRemove } 
      });
      logger.info(`   ✅ Deleted ${productResult.deletedCount} products\n`);
    } else {
      logger.info(`   ℹ️  No products to delete\n`);
    }

    // 2. Clean up Categories
    logger.info('📂 Cleaning up Categories...');
    const categoriesToDelete = await Category.find({ 
      petType: { $in: petTypesToRemove } 
    });
    
    logger.info(`   Found ${categoriesToDelete.length} categories to delete:`);
    categoriesToDelete.forEach(c => {
      logger.info(`   - ${c.name} (${c.petType})`);
    });

    if (categoriesToDelete.length > 0) {
      const categoryResult = await Category.deleteMany({ 
        petType: { $in: petTypesToRemove } 
      });
      logger.info(`   ✅ Deleted ${categoryResult.deletedCount} categories\n`);
    } else {
      logger.info(`   ℹ️  No categories to delete\n`);
    }

    // 3. Summary
    logger.info('📊 Summary:');
    const remainingProducts = await Product.countDocuments();
    const remainingCategories = await Category.countDocuments();
    const dogProducts = await Product.countDocuments({ petType: 'dog' });
    const catProducts = await Product.countDocuments({ petType: 'cat' });
    const dogCategories = await Category.countDocuments({ petType: 'dog' });
    const catCategories = await Category.countDocuments({ petType: 'cat' });
    const allCategories = await Category.countDocuments({ petType: 'all' });

    logger.info(`   Total Products Remaining: ${remainingProducts}`);
    logger.info(`     - Dog Products: ${dogProducts}`);
    logger.info(`     - Cat Products: ${catProducts}`);
    logger.info(`   Total Categories Remaining: ${remainingCategories}`);
    logger.info(`     - Dog Categories: ${dogCategories}`);
    logger.info(`     - Cat Categories: ${catCategories}`);
    logger.info(`     - All Pets Categories: ${allCategories}`);

    logger.info('\n✅ Cleanup completed successfully!');
    logger.info('🐕 Only Dog and Cat products remain in the database.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('\n❌ Error during cleanup:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run cleanup
cleanupPetTypes();


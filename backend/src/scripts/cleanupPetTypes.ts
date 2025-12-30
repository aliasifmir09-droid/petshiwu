import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';
import { connectDatabase } from '../utils/database';

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
    console.log('🧹 Starting pet type cleanup...\n');
    
    await connectDatabase();
    console.log('✅ Connected to database\n');

    // Pet types to remove
    const petTypesToRemove = ['bird', 'fish', 'small-pet', 'reptile'];

    // 1. Clean up Products
    console.log('📦 Cleaning up Products...');
    const productsToDelete = await Product.find({ 
      petType: { $in: petTypesToRemove } 
    });
    
    console.log(`   Found ${productsToDelete.length} products to delete:`);
    productsToDelete.forEach(p => {
      console.log(`   - ${p.name} (${p.petType})`);
    });

    if (productsToDelete.length > 0) {
      const productResult = await Product.deleteMany({ 
        petType: { $in: petTypesToRemove } 
      });
      console.log(`   ✅ Deleted ${productResult.deletedCount} products\n`);
    } else {
      console.log(`   ℹ️  No products to delete\n`);
    }

    // 2. Clean up Categories
    console.log('📂 Cleaning up Categories...');
    const categoriesToDelete = await Category.find({ 
      petType: { $in: petTypesToRemove } 
    });
    
    console.log(`   Found ${categoriesToDelete.length} categories to delete:`);
    categoriesToDelete.forEach(c => {
      console.log(`   - ${c.name} (${c.petType})`);
    });

    if (categoriesToDelete.length > 0) {
      const categoryResult = await Category.deleteMany({ 
        petType: { $in: petTypesToRemove } 
      });
      console.log(`   ✅ Deleted ${categoryResult.deletedCount} categories\n`);
    } else {
      console.log(`   ℹ️  No categories to delete\n`);
    }

    // 3. Summary
    console.log('📊 Summary:');
    const remainingProducts = await Product.countDocuments();
    const remainingCategories = await Category.countDocuments();
    const dogProducts = await Product.countDocuments({ petType: 'dog' });
    const catProducts = await Product.countDocuments({ petType: 'cat' });
    const dogCategories = await Category.countDocuments({ petType: 'dog' });
    const catCategories = await Category.countDocuments({ petType: 'cat' });
    const allCategories = await Category.countDocuments({ petType: 'all' });

    console.log(`   Total Products Remaining: ${remainingProducts}`);
    console.log(`     - Dog Products: ${dogProducts}`);
    console.log(`     - Cat Products: ${catProducts}`);
    console.log(`   Total Categories Remaining: ${remainingCategories}`);
    console.log(`     - Dog Categories: ${dogCategories}`);
    console.log(`     - Cat Categories: ${catCategories}`);
    console.log(`     - All Pets Categories: ${allCategories}`);

    console.log('\n✅ Cleanup completed successfully!');
    console.log('🐕 Only Dog and Cat products remain in the database.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run cleanup
cleanupPetTypes();


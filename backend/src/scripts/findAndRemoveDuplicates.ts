import mongoose from 'mongoose';
import Product from '../models/Product';
import { connectDatabase } from '../utils/database';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger';

dotenv.config({ path: path.join(__dirname, '../../.env') });

interface DuplicateGroup {
  key: string;
  products: any[];
  count: number;
}

/**
 * Finds and removes duplicate products from the database
 * @param dryRun - If true, only reports duplicates without removing them
 */
const findAndRemoveDuplicates = async (dryRun: boolean = true) => {
  try {
    logger.info('🔍 Starting duplicate product detection...\n');
    
    // Connect to database
    await connectDatabase();
    
    // Find duplicates by name + brand combination
    logger.info('📊 Analyzing products for duplicates...\n');
    
    const allProducts = await Product.find({}).lean();
    logger.info(`Total products in database: ${allProducts.length}\n`);
    
    // Group by name + brand (most common duplicate scenario)
    const nameBrandMap = new Map<string, any[]>();
    const slugMap = new Map<string, any[]>();
    const idMap = new Map<string, any[]>();
    
    for (const product of allProducts) {
      // Group by name + brand
      const nameBrandKey = `${String(product.name).toLowerCase().trim()}_${String(product.brand).toLowerCase().trim()}`;
      if (!nameBrandMap.has(nameBrandKey)) {
        nameBrandMap.set(nameBrandKey, []);
      }
      nameBrandMap.get(nameBrandKey)!.push(product);
      
      // Group by slug
      if (product.slug) {
        const slugKey = String(product.slug).toLowerCase();
        if (!slugMap.has(slugKey)) {
          slugMap.set(slugKey, []);
        }
        slugMap.get(slugKey)!.push(product);
      }
      
      // Group by _id (shouldn't have duplicates, but check anyway)
      const idKey = String(product._id);
      if (!idMap.has(idKey)) {
        idMap.set(idKey, []);
      }
      idMap.get(idKey)!.push(product);
    }
    
    // Find duplicates
    const duplicateGroups: DuplicateGroup[] = [];
    
    // Check name + brand duplicates
    for (const [key, products] of nameBrandMap.entries()) {
      if (products.length > 1) {
        duplicateGroups.push({
          key: `name+brand: ${key}`,
          products,
          count: products.length
        });
      }
    }
    
    // Check slug duplicates
    for (const [key, products] of slugMap.entries()) {
      if (products.length > 1) {
        duplicateGroups.push({
          key: `slug: ${key}`,
          products,
          count: products.length
        });
      }
    }
    
    // Check _id duplicates (shouldn't happen, but check)
    for (const [key, products] of idMap.entries()) {
      if (products.length > 1) {
        duplicateGroups.push({
          key: `_id: ${key}`,
          products,
          count: products.length
        });
      }
    }
    
    if (duplicateGroups.length === 0) {
      logger.info('✅ No duplicates found! Database is clean.\n');
      await mongoose.connection.close();
      return;
    }
    
    logger.info(`⚠️  Found ${duplicateGroups.length} duplicate groups:\n`);
    
    let totalDuplicatesToRemove = 0;
    const productsToDelete: string[] = [];
    
    for (const group of duplicateGroups) {
      logger.info(`\n📦 ${group.key}`);
      logger.info(`   Found ${group.count} products:`);
      
      // Sort by createdAt (keep the oldest one)
      const sorted = group.products.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
      });
      
      // Keep the first one (oldest), mark others for deletion
      const toKeep = sorted[0];
      const toDelete = sorted.slice(1);
      
      logger.info(`   ✅ Keeping: ${toKeep.name} (ID: ${toKeep._id}, Created: ${toKeep.createdAt})`);
      
      for (const product of toDelete) {
        logger.info(`   ❌ Will delete: ${product.name} (ID: ${product._id}, Created: ${product.createdAt})`);
        productsToDelete.push(String(product._id));
        totalDuplicatesToRemove++;
      }
    }
    
    logger.info(`\n📊 Summary:`);
    logger.info(`   Total duplicate groups: ${duplicateGroups.length}`);
    logger.info(`   Total products to remove: ${totalDuplicatesToRemove}`);
    
    if (dryRun) {
      logger.info(`\n🔍 DRY RUN MODE - No products were deleted.`);
      logger.info(`   To actually delete duplicates, run with: npm run remove-duplicates`);
    } else {
      logger.info(`\n🗑️  Removing duplicates...`);
      
      // Delete duplicates
      let deletedCount = 0;
      for (const productId of productsToDelete) {
        try {
          const result = await Product.deleteOne({ _id: productId });
          if (result.deletedCount > 0) {
            deletedCount++;
          }
        } catch (error: any) {
          logger.error(`   ❌ Error deleting product ${productId}: ${error.message}`);
        }
      }
      
      logger.info(`\n✅ Successfully deleted ${deletedCount} duplicate products!`);
      logger.info(`   Remaining products: ${allProducts.length - deletedCount}`);
    }
    
    await mongoose.connection.close();
    logger.info('\n✅ Process completed!\n');
    
  } catch (error: any) {
    logger.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
const runScript = async () => {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--delete');

  if (!dryRun) {
    logger.info('⚠️  WARNING: This will permanently delete duplicate products!');
    logger.info('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  await findAndRemoveDuplicates(dryRun);
};

runScript().catch((error) => {
  logger.error('❌ Script error:', error);
  process.exit(1);
});


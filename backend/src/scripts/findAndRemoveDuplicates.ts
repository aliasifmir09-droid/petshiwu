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
 * Calculate similarity between two strings (simple Levenshtein-like comparison)
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return minLen / maxLen;
  }
  
  // Simple word overlap check
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

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
    
    // Get total count and ALL products using MongoDB directly to bypass any Mongoose filters/limits
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    const productsCollection = db.collection('products');
    
    // Get total count first
    const totalCount = await productsCollection.countDocuments({});
    logger.info(`Total products in database: ${totalCount}\n`);
    
    // Fetch ALL products directly from MongoDB (bypass Mongoose entirely to avoid any filters/limits)
    logger.info('📥 Fetching all products from database...\n');
    const allProductsCursor = productsCollection.find({});
    const allProducts: any[] = [];
    
    // Process in batches to handle large collections
    const BATCH_SIZE = 1000;
    let processedCount = 0;
    
    while (await allProductsCursor.hasNext()) {
      const batch: any[] = [];
      for (let i = 0; i < BATCH_SIZE && await allProductsCursor.hasNext(); i++) {
        const product = await allProductsCursor.next();
        if (product) batch.push(product);
      }
      allProducts.push(...batch);
      processedCount += batch.length;
      
      if (processedCount % 5000 === 0 || processedCount === totalCount) {
        logger.info(`   Processed ${processedCount}/${totalCount} products...`);
      }
    }
    
    logger.info(`✅ Loaded ${allProducts.length} products from database\n`);
    
    if (allProducts.length !== totalCount) {
      logger.warn(`⚠️  Warning: Expected ${totalCount} products but loaded ${allProducts.length}. This may indicate an issue.`);
    }
    
    // Log sample products for debugging (only if <= 50 products)
    if (allProducts.length <= 50) {
      logger.info('📋 All products in database:');
      allProducts.forEach((p, idx) => {
        logger.info(`   ${idx + 1}. "${p.name}" by ${p.brand} (slug: ${p.slug}, ID: ${p._id})`);
      });
      logger.info('');
    } else {
      logger.info(`📋 Showing first 20 of ${allProducts.length} products:`);
      allProducts.slice(0, 20).forEach((p, idx) => {
        logger.info(`   ${idx + 1}. "${p.name}" by ${p.brand} (slug: ${p.slug})`);
      });
      logger.info(`   ... and ${allProducts.length - 20} more products\n`);
    }
    
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
    
    // Check for similar product names (fuzzy matching) - same brand with similar names
    const similarProducts: Array<{ products: any[]; similarity: number; reason: string }> = [];
    for (let i = 0; i < allProducts.length; i++) {
      for (let j = i + 1; j < allProducts.length; j++) {
        const p1 = allProducts[i];
        const p2 = allProducts[j];
        
        // Only check if same brand
        if (String(p1.brand).toLowerCase().trim() === String(p2.brand).toLowerCase().trim()) {
          const nameSimilarity = calculateSimilarity(String(p1.name), String(p2.name));
          
          // If names are very similar (>= 80% similar), flag as potential duplicate
          if (nameSimilarity >= 0.8) {
            const existing = similarProducts.find(sp => 
              sp.products.includes(p1) || sp.products.includes(p2)
            );
            
            if (!existing) {
              similarProducts.push({
                products: [p1, p2],
                similarity: nameSimilarity,
                reason: `Very similar names (${Math.round(nameSimilarity * 100)}% similar) with same brand`
              });
            } else {
              // Add to existing group if not already included
              if (!existing.products.includes(p1)) existing.products.push(p1);
              if (!existing.products.includes(p2)) existing.products.push(p2);
            }
          }
        }
      }
    }
    
    // Only add 100% exact matches (not fuzzy matching)
    // Note: 100% similarity means exact same name+brand combination (already caught above)
    // This section is kept for logging but won't add to duplicates
    const exactSimilarProducts = similarProducts.filter(s => s.similarity >= 1.0);
    
    if (exactSimilarProducts.length > 0) {
      logger.info(`\n⚠️  Found ${exactSimilarProducts.length} groups with 100% identical names (these should already be caught by name+brand check):`);
      for (const similar of exactSimilarProducts.slice(0, 10)) {
        logger.info(`   - ${similar.products.length} products with identical name: "${similar.products[0].name}"`);
      }
      if (exactSimilarProducts.length > 10) {
        logger.info(`   ... and ${exactSimilarProducts.length - 10} more groups`);
      }
    }
    
    if (duplicateGroups.length === 0) {
      logger.info('✅ No exact duplicates found by name+brand or slug!\n');
      
      // Show products with similar names (90%+) as informational only (not duplicates)
      const nearMatches = similarProducts.filter(s => s.similarity >= 0.9 && s.similarity < 1.0);
      if (nearMatches.length > 0) {
        logger.info(`\n⚠️  Found ${nearMatches.length} product groups with very similar names (90%+ similar but not 100% identical):`);
        logger.info('   These are NOT considered duplicates - they may be legitimate product variants.');
        logger.info('   Review manually if needed. Examples:');
        for (const similar of nearMatches.slice(0, 5)) {
          logger.info(`\n   ${similar.reason}:`);
          similar.products.slice(0, 3).forEach(p => {
            logger.info(`      - "${p.name}" (ID: ${p._id})`);
          });
        }
        if (nearMatches.length > 5) {
          logger.info(`\n   ... and ${nearMatches.length - 5} more groups with similar names`);
        }
        logger.info('');
      }
      
      // Close connection properly
      try {
        await mongoose.connection.close();
      } catch (closeError) {
        // Ignore close errors
      }
      process.exit(0);
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
    
    // Close connection properly
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      // Ignore close errors
    }
    
    logger.info('\n✅ Process completed!\n');
    process.exit(0);
    
  } catch (error: any) {
    logger.error('❌ Error:', error);
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      // Ignore close errors
    }
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


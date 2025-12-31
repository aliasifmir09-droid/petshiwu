/**
 * Utility script to fix variants.sku index
 * Run this once to drop the old non-sparse index and create a sparse one
 * 
 * Usage: npm run fix-sku-index
 * Or: ts-node src/utils/fixSkuIndex.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

/**
 * Fixes the variants.sku index by making it sparse
 * This allows products without SKUs to exist without index errors
 */
const fixSkuIndex = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pet-ecommerce';
    
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    logger.info('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not available');
    }

    const productsCollection = db.collection('products');
    
    // Get all indexes
    logger.info('\n📋 Current indexes:');
    const indexes = await productsCollection.indexes();
    indexes.forEach((idx: any) => {
      if (idx.key && idx.key['variants.sku']) {
        logger.info(`  - ${idx.name}: sparse=${idx.sparse || false}, unique=${idx.unique || false}`);
      }
    });
    
    // Find and drop ALL variants.sku indexes
    const skuIndexes = indexes.filter((idx: any) => 
      idx.name === 'variants.sku_1' || 
      idx.name === 'variants.sku_1_sparse' ||
      (idx.key && idx.key['variants.sku'] === 1)
    );
    
    logger.info(`\n🔧 Found ${skuIndexes.length} variants.sku index(es) to fix`);
    
    for (const index of skuIndexes) {
      try {
        const indexName = index.name || 'variants.sku_1';
        logger.info(`  Dropping: ${indexName}...`);
        await productsCollection.dropIndex(indexName);
        logger.info(`  ✅ Dropped: ${indexName}`);
      } catch (error: any) {
        if (error.code === 27) {
          logger.info(`  ⚠️  Index ${index.name || 'variants.sku_1'} not found (already dropped)`);
        } else {
          throw error;
        }
      }
    }
    
    // Create sparse unique index
    logger.info('\n📝 Creating sparse unique index...');
    try {
      await productsCollection.createIndex(
        { 'variants.sku': 1 },
        { unique: true, sparse: true, name: 'variants.sku_1_sparse' }
      );
      logger.info('✅ Sparse unique index created successfully');
    } catch (error: any) {
      if (error.code === 85) {
        logger.info('✅ Sparse index already exists');
      } else {
        throw error;
      }
    }
    
    // Verify
    logger.info('\n📋 Updated indexes:');
    const updatedIndexes = await productsCollection.indexes();
    const skuIndex = updatedIndexes.find((idx: any) => 
      idx.key && idx.key['variants.sku'] === 1
    );
    if (skuIndex) {
      logger.info(`  ✅ ${skuIndex.name}: sparse=${skuIndex.sparse || false}, unique=${skuIndex.unique || false}`);
    }
    
    logger.info('\n✅ Index fix completed!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error fixing index:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

fixSkuIndex();


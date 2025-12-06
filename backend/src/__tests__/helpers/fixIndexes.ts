/**
 * Fix database indexes for tests
 * Drops old non-sparse unique index on variants.sku and ensures sparse index exists
 */
import mongoose from 'mongoose';

export const fixProductIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.warn('Database not connected, skipping index fix');
      return;
    }

    const productsCollection = db.collection('products');
    
    // Get all indexes
    const indexes = await productsCollection.indexes();
    
    // Find and drop ALL variants.sku indexes (we'll recreate as sparse)
    const skuIndexes = indexes.filter((idx: any) => 
      idx.name === 'variants.sku_1' || 
      idx.name === 'variants.sku_1_sparse' ||
      (idx.key && idx.key['variants.sku'] === 1)
    );
    
    for (const index of skuIndexes) {
      try {
        const indexName = index.name || 'variants.sku_1';
        if (!indexName) {
          console.log(`  ⚠️  Skipping index with no name`);
          continue;
        }
        console.log(`Dropping index: ${indexName}...`);
        await productsCollection.dropIndex(indexName);
        console.log(`✅ Index ${indexName} dropped`);
      } catch (error: any) {
        if (error.code !== 27) { // Index not found
          const indexName = index.name || 'variants.sku_1';
          console.warn(`Warning dropping index ${indexName}:`, error.message);
        }
      }
    }
    
    // Always create sparse unique index
    try {
      console.log('Creating sparse unique index on variants.sku...');
      await productsCollection.createIndex(
        { 'variants.sku': 1 },
        { unique: true, sparse: true, name: 'variants.sku_1_sparse' }
      );
      console.log('✅ Sparse index created');
    } catch (error: any) {
      if (error.code === 85) { // Index already exists
        console.log('✅ Sparse index already exists');
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.warn('Warning fixing indexes:', error.message);
    // Don't throw - allow tests to continue
  }
};


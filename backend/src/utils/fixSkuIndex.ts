/**
 * Utility script to fix variants.sku index
 * Run this once to drop the old non-sparse index and create a sparse one
 * 
 * Usage: npm run fix-sku-index
 * Or: ts-node src/utils/fixSkuIndex.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixSkuIndex = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pet-ecommerce';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not available');
    }

    const productsCollection = db.collection('products');
    
    // Get all indexes
    console.log('\n📋 Current indexes:');
    const indexes = await productsCollection.indexes();
    indexes.forEach((idx: any) => {
      if (idx.key && idx.key['variants.sku']) {
        console.log(`  - ${idx.name}: sparse=${idx.sparse || false}, unique=${idx.unique || false}`);
      }
    });
    
    // Find and drop ALL variants.sku indexes
    const skuIndexes = indexes.filter((idx: any) => 
      idx.name === 'variants.sku_1' || 
      idx.name === 'variants.sku_1_sparse' ||
      (idx.key && idx.key['variants.sku'] === 1)
    );
    
    console.log(`\n🔧 Found ${skuIndexes.length} variants.sku index(es) to fix`);
    
    for (const index of skuIndexes) {
      try {
        const indexName = index.name || 'variants.sku_1';
        console.log(`  Dropping: ${indexName}...`);
        await productsCollection.dropIndex(indexName);
        console.log(`  ✅ Dropped: ${indexName}`);
      } catch (error: any) {
        if (error.code === 27) {
          console.log(`  ⚠️  Index ${index.name || 'variants.sku_1'} not found (already dropped)`);
        } else {
          throw error;
        }
      }
    }
    
    // Create sparse unique index
    console.log('\n📝 Creating sparse unique index...');
    try {
      await productsCollection.createIndex(
        { 'variants.sku': 1 },
        { unique: true, sparse: true, name: 'variants.sku_1_sparse' }
      );
      console.log('✅ Sparse unique index created successfully');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('✅ Sparse index already exists');
      } else {
        throw error;
      }
    }
    
    // Verify
    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await productsCollection.indexes();
    const skuIndex = updatedIndexes.find((idx: any) => 
      idx.key && idx.key['variants.sku'] === 1
    );
    if (skuIndex) {
      console.log(`  ✅ ${skuIndex.name}: sparse=${skuIndex.sparse || false}, unique=${skuIndex.unique || false}`);
    }
    
    console.log('\n✅ Index fix completed!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error fixing index:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

fixSkuIndex();


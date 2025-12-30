import dotenv from 'dotenv';
import { connectDatabase } from '../utils/database';
import mongoose from 'mongoose';

dotenv.config();

/**
 * Analyze database indexes and their usage
 */
const analyzeIndexes = async () => {
  try {
    await connectDatabase();
    console.log('✅ Connected to database\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    const collections = await db.listCollections().toArray();

    console.log('📊 Database Index Analysis\n');
    console.log('='.repeat(70));

    let totalIndexSize = 0;
    let totalDataSize = 0;
    let totalIndexes = 0;

    for (const collection of collections) {
      const stats = await db.command({ collStats: collection.name });
      const indexes = await db.collection(collection.name).indexes();
      
      const dataSize = stats.size || 0;
      const indexSize = stats.totalIndexSize || 0;
      const docCount = stats.count || 0;
      const indexCount = indexes.length;

      totalIndexSize += indexSize;
      totalDataSize += dataSize;
      totalIndexes += indexCount;

      const dataSizeMB = (dataSize / 1024 / 1024).toFixed(2);
      const indexSizeMB = (indexSize / 1024 / 1024).toFixed(2);
      const ratio = dataSize > 0 ? ((indexSize / dataSize) * 100).toFixed(1) : 'N/A';

      console.log(`\n📁 Collection: ${collection.name}`);
      console.log(`   Documents: ${docCount.toLocaleString()}`);
      console.log(`   Data Size: ${dataSizeMB} MB`);
      console.log(`   Indexes: ${indexCount}`);
      console.log(`   Index Size: ${indexSizeMB} MB`);
      console.log(`   Index/Data Ratio: ${ratio}%`);

      // Show problematic collections
      if (indexSize > dataSize && dataSize > 0) {
        console.log(`   ⚠️  WARNING: Indexes larger than data!`);
      }

      if (indexCount > 10) {
        console.log(`   ⚠️  WARNING: Many indexes (${indexCount}) - consider reviewing`);
      }

      // List all indexes
      if (indexes.length > 0) {
        console.log(`\n   Index Details:`);
        indexes.forEach((index: any, idx: number) => {
          const indexName = index.name;
          const indexKeys = Object.keys(index.key).map(key => `${key}:${index.key[key]}`).join(', ');
          const isUnique = index.unique ? ' [UNIQUE]' : '';
          const isSparse = index.sparse ? ' [SPARSE]' : '';
          const isText = index.textIndexVersion ? ' [TEXT]' : '';
          
          console.log(`     ${idx + 1}. ${indexName}`);
          console.log(`        Keys: {${indexKeys}}${isUnique}${isSparse}${isText}`);
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 Overall Summary:');
    console.log('='.repeat(70));
    console.log(`   Total Collections: ${collections.length}`);
    const productsCount = await db.collection('products').countDocuments();
    const usersCount = await db.collection('users').countDocuments();
    const ordersCount = await db.collection('orders').countDocuments();
    console.log(`   Total Documents: ${productsCount + usersCount + ordersCount}`);
    console.log(`   Total Data Size: ${(totalDataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Total Indexes: ${totalIndexes}`);
    console.log(`   Total Index Size: ${(totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
    
    const overallRatio = totalDataSize > 0 ? ((totalIndexSize / totalDataSize) * 100).toFixed(1) : 'N/A';
    console.log(`   Overall Index/Data Ratio: ${overallRatio}%`);

    if (totalIndexSize > totalDataSize) {
      console.log(`\n   ⚠️  WARNING: Total index size (${(totalIndexSize / 1024 / 1024).toFixed(2)} MB) is larger than data size (${(totalDataSize / 1024 / 1024).toFixed(2)} MB)!`);
      console.log(`   💡 Consider reviewing and removing unused indexes.\n`);
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('='.repeat(70));
    
    const productsCollection = collections.find(c => c.name === 'products');
    if (productsCollection) {
      const productsStats = await db.command({ collStats: 'products' });
      const productsIndexes = await db.collection('products').indexes();
      
      if (productsIndexes.length > 15) {
        console.log(`\n   1. Products collection has ${productsIndexes.length} indexes`);
        console.log(`      - Review which indexes are actually used by your queries`);
        console.log(`      - Consider removing indexes on rarely-queried fields`);
        console.log(`      - Compound indexes can replace multiple single-field indexes`);
      }

      // Check for duplicate indexes
      const indexKeys = productsIndexes.map((idx: any) => 
        Object.keys(idx.key).sort().join(',')
      );
      const duplicates = indexKeys.filter((key: string, idx: number) => 
        indexKeys.indexOf(key) !== idx
      );
      
      if (duplicates.length > 0) {
        console.log(`\n   2. Found potential duplicate indexes`);
        console.log(`      - Review indexes with similar key patterns`);
      }
    }

    console.log(`\n   3. Essential indexes to keep:`);
    console.log(`      - _id (automatic, cannot be removed)`);
    console.log(`      - slug (for product lookups)`);
    console.log(`      - category (for filtering)`);
    console.log(`      - petType (for filtering)`);
    console.log(`      - isActive, isFeatured (for filtering)`);
    console.log(`      - Compound indexes for common query patterns`);

    console.log(`\n   4. Indexes you might be able to remove:`);
    console.log(`      - Indexes on fields rarely used in queries`);
    console.log(`      - Single-field indexes that are part of compound indexes`);
    console.log(`      - Indexes on low-cardinality fields (like boolean flags)`);

    await mongoose.connection.close();
    console.log('\n✅ Analysis complete!\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

analyzeIndexes();


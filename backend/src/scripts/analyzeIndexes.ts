import dotenv from 'dotenv';
import { connectDatabase } from '../utils/database';
import mongoose from 'mongoose';
import logger from '../utils/logger';

dotenv.config();

/**
 * Analyze database indexes and their usage
 */
const analyzeIndexes = async () => {
  try {
    await connectDatabase();
    logger.info('✅ Connected to database\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    const collections = await db.listCollections().toArray();

    logger.info('📊 Database Index Analysis\n');
    logger.info('='.repeat(70));

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

      logger.info(`\n📁 Collection: ${collection.name}`);
      logger.info(`   Documents: ${docCount.toLocaleString()}`);
      logger.info(`   Data Size: ${dataSizeMB} MB`);
      logger.info(`   Indexes: ${indexCount}`);
      logger.info(`   Index Size: ${indexSizeMB} MB`);
      logger.info(`   Index/Data Ratio: ${ratio}%`);

      // Show problematic collections
      if (indexSize > dataSize && dataSize > 0) {
        logger.info(`   ⚠️  WARNING: Indexes larger than data!`);
      }

      if (indexCount > 10) {
        logger.info(`   ⚠️  WARNING: Many indexes (${indexCount}) - consider reviewing`);
      }

      // List all indexes
      if (indexes.length > 0) {
        logger.info(`\n   Index Details:`);
        indexes.forEach((index: any, idx: number) => {
          const indexName = index.name;
          const indexKeys = Object.keys(index.key).map(key => `${key}:${index.key[key]}`).join(', ');
          const isUnique = index.unique ? ' [UNIQUE]' : '';
          const isSparse = index.sparse ? ' [SPARSE]' : '';
          const isText = index.textIndexVersion ? ' [TEXT]' : '';
          
          logger.info(`     ${idx + 1}. ${indexName}`);
          logger.info(`        Keys: {${indexKeys}}${isUnique}${isSparse}${isText}`);
        });
      }
    }

    // Summary
    logger.info('\n' + '='.repeat(70));
    logger.info('📊 Overall Summary:');
    logger.info('='.repeat(70));
    logger.info(`   Total Collections: ${collections.length}`);
    const productsCount = await db.collection('products').countDocuments();
    const usersCount = await db.collection('users').countDocuments();
    const ordersCount = await db.collection('orders').countDocuments();
    logger.info(`   Total Documents: ${productsCount + usersCount + ordersCount}`);
    logger.info(`   Total Data Size: ${(totalDataSize / 1024 / 1024).toFixed(2)} MB`);
    logger.info(`   Total Indexes: ${totalIndexes}`);
    logger.info(`   Total Index Size: ${(totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
    
    const overallRatio = totalDataSize > 0 ? ((totalIndexSize / totalDataSize) * 100).toFixed(1) : 'N/A';
    logger.info(`   Overall Index/Data Ratio: ${overallRatio}%`);

    if (totalIndexSize > totalDataSize) {
      logger.info(`\n   ⚠️  WARNING: Total index size (${(totalIndexSize / 1024 / 1024).toFixed(2)} MB) is larger than data size (${(totalDataSize / 1024 / 1024).toFixed(2)} MB)!`);
      logger.info(`   💡 Consider reviewing and removing unused indexes.\n`);
    }

    // Recommendations
    logger.info('\n💡 Recommendations:');
    logger.info('='.repeat(70));
    
    const productsCollection = collections.find(c => c.name === 'products');
    if (productsCollection) {
      const productsStats = await db.command({ collStats: 'products' });
      const productsIndexes = await db.collection('products').indexes();
      
      if (productsIndexes.length > 15) {
        logger.info(`\n   1. Products collection has ${productsIndexes.length} indexes`);
        logger.info(`      - Review which indexes are actually used by your queries`);
        logger.info(`      - Consider removing indexes on rarely-queried fields`);
        logger.info(`      - Compound indexes can replace multiple single-field indexes`);
      }

      // Check for duplicate indexes
      const indexKeys = productsIndexes.map((idx: any) => 
        Object.keys(idx.key).sort().join(',')
      );
      const duplicates = indexKeys.filter((key: string, idx: number) => 
        indexKeys.indexOf(key) !== idx
      );
      
      if (duplicates.length > 0) {
        logger.info(`\n   2. Found potential duplicate indexes`);
        logger.info(`      - Review indexes with similar key patterns`);
      }
    }

    logger.info(`\n   3. Essential indexes to keep:`);
    logger.info(`      - _id (automatic, cannot be removed)`);
    logger.info(`      - slug (for product lookups)`);
    logger.info(`      - category (for filtering)`);
    logger.info(`      - petType (for filtering)`);
    logger.info(`      - isActive, isFeatured (for filtering)`);
    logger.info(`      - Compound indexes for common query patterns`);

    logger.info(`\n   4. Indexes you might be able to remove:`);
    logger.info(`      - Indexes on fields rarely used in queries`);
    logger.info(`      - Single-field indexes that are part of compound indexes`);
    logger.info(`      - Indexes on low-cardinality fields (like boolean flags)`);

    await mongoose.connection.close();
    logger.info('\n✅ Analysis complete!\n');
  } catch (error: any) {
    logger.error('❌ Error:', error.message);
    process.exit(1);
  }
};

analyzeIndexes();


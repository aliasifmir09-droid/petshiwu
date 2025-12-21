import mongoose from 'mongoose';
import Product from '../models/Product';
import logger from './logger';

/**
 * Analyze MongoDB index usage for Product collection
 * Helps identify unused indexes and optimize index strategy
 */
export const analyzeIndexUsage = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      logger.error('Database not connected. Cannot analyze indexes.');
      return;
    }

    const db = mongoose.connection.db;
    if (!db) {
      logger.error('Database instance not available.');
      return;
    }

    // Get index statistics
    const collection = db.collection('products');
    const stats = await collection.stats();
    const indexes = await collection.indexes();

    logger.info('=== Product Collection Index Analysis ===');
    logger.info(`Total Indexes: ${indexes.length}`);
    logger.info(`Index Size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
    logger.info(`Collection Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    logger.info(`Index to Collection Ratio: ${((stats.totalIndexSize / stats.size) * 100).toFixed(2)}%`);

    // Analyze each index
    logger.info('\n=== Index Details ===');
    for (const index of indexes) {
      const indexName = index.name;
      const indexKeys = JSON.stringify(index.key);
      const indexSize = index.size ? `${(index.size / 1024).toFixed(2)} KB` : 'Unknown';
      
      logger.info(`\nIndex: ${indexName}`);
      logger.info(`  Keys: ${indexKeys}`);
      logger.info(`  Size: ${indexSize}`);
      logger.info(`  Unique: ${index.unique || false}`);
      logger.info(`  Sparse: ${index.sparse || false}`);
    }

    // Run explain on common queries to see which indexes are used
    logger.info('\n=== Index Usage Analysis ===');
    
    const commonQueries = [
      { petType: 'dog', isActive: true },
      { category: new mongoose.Types.ObjectId(), isActive: true },
      { brand: 'Royal Canin', isActive: true },
      { isActive: true, inStock: true },
      { isActive: true, averageRating: { $gte: 4 } },
      { isActive: true, basePrice: { $gte: 10, $lte: 100 } }
    ];

    for (const query of commonQueries) {
      try {
        const explainResult = await Product.find(query).limit(1).explain('executionStats');
        const executionStats = (explainResult as any).executionStats;
        
        if (executionStats) {
          logger.info(`\nQuery: ${JSON.stringify(query)}`);
          logger.info(`  Execution Time: ${executionStats.executionTimeMillis}ms`);
          logger.info(`  Documents Examined: ${executionStats.totalDocsExamined}`);
          logger.info(`  Documents Returned: ${executionStats.nReturned}`);
          logger.info(`  Index Used: ${executionStats.executionStages?.indexName || 'Collection Scan'}`);
        }
      } catch (error) {
        logger.warn(`Could not analyze query ${JSON.stringify(query)}:`, error);
      }
    }

    logger.info('\n=== Recommendations ===');
    logger.info('1. Review indexes with high size but low usage');
    logger.info('2. Consider removing unused indexes to improve write performance');
    logger.info('3. Monitor index usage over time to optimize strategy');
    logger.info('4. Use compound indexes for frequently combined filters');

  } catch (error) {
    logger.error('Error analyzing index usage:', error);
  }
};

// Run analysis if called directly
if (require.main === module) {
  import('../utils/database').then(({ connectDatabase }) => {
    connectDatabase().then(() => {
      // Wait for connection
      setTimeout(() => {
        analyzeIndexUsage().then(() => {
          process.exit(0);
        }).catch((error) => {
          logger.error('Analysis failed:', error);
          process.exit(1);
        });
      }, 2000);
    });
  });
}

/**
 * Get index usage statistics (simplified version)
 */
export const getIndexStats = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return null;
    }

    const collection = db.collection('products');
    const stats = await collection.stats();
    const indexes = await collection.indexes();

    return {
      totalIndexes: indexes.length,
      indexSizeMB: (stats.totalIndexSize / 1024 / 1024).toFixed(2),
      collectionSizeMB: (stats.size / 1024 / 1024).toFixed(2),
      indexRatio: ((stats.totalIndexSize / stats.size) * 100).toFixed(2),
      indexes: indexes.map(idx => ({
        name: idx.name,
        keys: idx.key,
        unique: idx.unique || false,
        sparse: idx.sparse || false
      }))
    };
  } catch (error) {
    logger.error('Error getting index stats:', error);
    return null;
  }
};


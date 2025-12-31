import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from '../utils/database';
import logger from '../utils/logger';

dotenv.config();

/**
 * Migration script to fix category indexes
 * This removes the old unique index on 'name' field
 * and allows the new compound index (name + petType + parentCategory) to be created
 */
const fixCategoryIndex = async () => {
  try {
    logger.info('🔄 Connecting to database...');
    await connectDatabase();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    logger.info('📋 Checking existing indexes on categories collection...');
    const collection = db.collection('categories');
    const indexes = await collection.indexes();
    
    logger.info('Current indexes:');
    indexes.forEach(index => {
      logger.info(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop the old unique index on 'name' if it exists
    const nameIndexExists = indexes.some(index => index.key.name === 1 && Object.keys(index.key).length === 1);
    
    if (nameIndexExists) {
      logger.info('\n🗑️  Dropping old unique index on "name" field...');
      await collection.dropIndex('name_1');
      logger.info('✅ Successfully dropped old index');
    } else {
      logger.info('\n✓ No old "name" index found - already removed or never existed');
    }

    logger.info('\n📋 Updated indexes:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      logger.info(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    logger.info('\n✅ Migration complete!');
    logger.info('ℹ️  The new compound index (name + petType + parentCategory) will be created automatically when the server starts.');
    logger.info('ℹ️  This allows subcategories with the same name under different pet types or parent categories.');

  } catch (error: any) {
    if (error.code === 27 || error.message.includes('index not found')) {
      logger.info('✓ Index already removed or does not exist');
    } else {
      logger.error('❌ Error during migration:', error);
      process.exit(1);
    }
  } finally {
    await mongoose.connection.close();
    logger.info('\n🔌 Database connection closed');
  }
};

fixCategoryIndex();














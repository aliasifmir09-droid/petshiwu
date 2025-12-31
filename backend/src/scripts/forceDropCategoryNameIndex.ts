import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from '../utils/database';
import logger from '../utils/logger';

dotenv.config();

/**
 * Force drop the old 'name_1' and 'slug_1' indexes if they exist
 */
const forceDropCategoryNameIndex = async () => {
  try {
    logger.info('🔄 Connecting to database...');
    await connectDatabase();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const collection = db.collection('categories');
    
    // Drop name_1 index
    logger.info('🗑️  Attempting to drop "name_1" index...');
    try {
      await collection.dropIndex('name_1');
      logger.info('✅ Successfully dropped "name_1" index');
    } catch (error: any) {
      if (error.code === 27 || error.message?.includes('index not found')) {
        logger.info('✓ Index "name_1" does not exist - no action needed');
      } else {
        throw error;
      }
    }

    // Drop slug_1 index
    logger.info('\n🗑️  Attempting to drop "slug_1" index...');
    try {
      await collection.dropIndex('slug_1');
      logger.info('✅ Successfully dropped "slug_1" index');
    } catch (error: any) {
      if (error.code === 27 || error.message?.includes('index not found')) {
        logger.info('✓ Index "slug_1" does not exist - no action needed');
      } else {
        throw error;
      }
    }

    logger.info('\n📋 Final indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      logger.info(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    logger.info('\n✅ Done! You can now create subcategories with the same name under different pet types or parent categories.');

  } catch (error: any) {
    logger.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('\n🔌 Database connection closed');
  }
};

forceDropCategoryNameIndex();


import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from './database';

dotenv.config();

/**
 * Force drop the old 'name_1' and 'slug_1' indexes if they exist
 */
const forceDropCategoryNameIndex = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDatabase();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const collection = db.collection('categories');
    
    // Drop name_1 index
    console.log('🗑️  Attempting to drop "name_1" index...');
    try {
      await collection.dropIndex('name_1');
      console.log('✅ Successfully dropped "name_1" index');
    } catch (error: any) {
      if (error.code === 27 || error.message?.includes('index not found')) {
        console.log('✓ Index "name_1" does not exist - no action needed');
      } else {
        throw error;
      }
    }

    // Drop slug_1 index
    console.log('\n🗑️  Attempting to drop "slug_1" index...');
    try {
      await collection.dropIndex('slug_1');
      console.log('✅ Successfully dropped "slug_1" index');
    } catch (error: any) {
      if (error.code === 27 || error.message?.includes('index not found')) {
        console.log('✓ Index "slug_1" does not exist - no action needed');
      } else {
        throw error;
      }
    }

    console.log('\n📋 Final indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Done! You can now create subcategories with the same name under different pet types or parent categories.');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

forceDropCategoryNameIndex();


import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from './database';

dotenv.config();

/**
 * Migration script to fix category indexes
 * This removes the old unique index on 'name' field
 * and allows the new compound index (name + petType + parentCategory) to be created
 */
const fixCategoryIndex = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDatabase();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    console.log('📋 Checking existing indexes on categories collection...');
    const collection = db.collection('categories');
    const indexes = await collection.indexes();
    
    console.log('Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop the old unique index on 'name' if it exists
    const nameIndexExists = indexes.some(index => index.key.name === 1 && Object.keys(index.key).length === 1);
    
    if (nameIndexExists) {
      console.log('\n🗑️  Dropping old unique index on "name" field...');
      await collection.dropIndex('name_1');
      console.log('✅ Successfully dropped old index');
    } else {
      console.log('\n✓ No old "name" index found - already removed or never existed');
    }

    console.log('\n📋 Updated indexes:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Migration complete!');
    console.log('ℹ️  The new compound index (name + petType + parentCategory) will be created automatically when the server starts.');
    console.log('ℹ️  This allows subcategories with the same name under different pet types or parent categories.');

  } catch (error: any) {
    if (error.code === 27 || error.message.includes('index not found')) {
      console.log('✓ Index already removed or does not exist');
    } else {
      console.error('❌ Error during migration:', error);
      process.exit(1);
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

fixCategoryIndex();










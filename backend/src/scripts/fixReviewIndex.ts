import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const fixReviewIndex = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pet-ecommerce', {
      serverSelectionTimeoutMS: 5000,
      family: 4
    });

    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    const reviewsCollection = db.collection('reviews');

    console.log('📋 Current indexes on reviews collection:');
    const indexes = await reviewsCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop the old index that prevents multiple reviews per product
    try {
      console.log('\n🗑️  Dropping old index: product_1_user_1...');
      await reviewsCollection.dropIndex('product_1_user_1');
      console.log('✅ Old index dropped successfully!');
    } catch (error: any) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('ℹ️  Old index already dropped or doesn\'t exist');
      } else {
        throw error;
      }
    }

    console.log('\n📋 Updated indexes:');
    const newIndexes = await reviewsCollection.indexes();
    console.log(JSON.stringify(newIndexes, null, 2));

    console.log('\n✅ Index migration completed successfully!');
    console.log('🎉 Users can now review the same product for different orders!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing review index:', error);
    process.exit(1);
  }
};

fixReviewIndex();


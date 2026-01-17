import mongoose from 'mongoose';
import { connectDatabase } from '../utils/database';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const checkDatabase = async () => {
  try {
    logger.info('🔍 Checking database connection...\n');
    
    // Connect to database
    await connectDatabase();
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const dbName = db.databaseName;
    logger.info(`📊 Connected to database: ${dbName}\n`);
    
    // Get collection stats
    const collections = await db.listCollections().toArray();
    logger.info(`📦 Collections found: ${collections.length}\n`);
    
    // Count documents in each collection
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments({});
      logger.info(`   ${collection.name}: ${count} documents`);
      
      // Special check for products
      if (collection.name === 'products') {
        logger.info(`\n   🔍 Products collection details:`);
        
        // Get sample products to verify
        const sampleProducts = await db.collection('products')
          .find({})
          .limit(5)
          .project({ name: 1, brand: 1, slug: 1, _id: 1 })
          .toArray();
        
        logger.info(`   Sample products (first 5):`);
        sampleProducts.forEach((p, idx) => {
          logger.info(`     ${idx + 1}. "${p.name}" by ${p.brand} (slug: ${p.slug})`);
        });
        
        // Check for duplicate slugs using aggregation
        const duplicateSlugs = await db.collection('products')
          .aggregate([
            { $group: { _id: '$slug', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ])
          .toArray();
        
        if (duplicateSlugs.length > 0) {
          logger.info(`\n   ⚠️  Found ${duplicateSlugs.length} slugs with duplicates:`);
          duplicateSlugs.forEach(d => {
            logger.info(`     - "${d._id}": ${d.count} products`);
          });
        } else {
          logger.info(`\n   ✅ No duplicate slugs found`);
        }
        
        // Check for duplicate name+brand combinations
        const duplicateNameBrand = await db.collection('products')
          .aggregate([
            {
              $group: {
                _id: {
                  name: { $toLower: '$name' },
                  brand: { $toLower: '$brand' }
                },
                count: { $sum: 1 },
                products: { $push: { _id: '$_id', name: '$name', slug: '$slug' } }
              }
            },
            { $match: { count: { $gt: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ])
          .toArray();
        
        if (duplicateNameBrand.length > 0) {
          logger.info(`\n   ⚠️  Found ${duplicateNameBrand.length} name+brand combinations with duplicates:`);
          duplicateNameBrand.forEach(d => {
            logger.info(`     - "${d._id.name}" by "${d._id.brand}": ${d.count} products`);
            d.products.forEach((p: any) => {
              logger.info(`       - ID: ${p._id}, Slug: ${p.slug}`);
            });
          });
        } else {
          logger.info(`\n   ✅ No duplicate name+brand combinations found`);
        }
      }
    }
    
    // Show MongoDB URI (sanitized)
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pet-ecommerce';
    const sanitizedUri = mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@').replace(/\/\/[^@]+@/, '//<credentials>@');
    logger.info(`\n📡 MongoDB URI: ${sanitizedUri}`);
    logger.info(`   (Check your .env file or environment variables to change)\n`);
    
    // Close connection
    setTimeout(async () => {
      try {
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close();
        }
      } catch (closeError) {
        // Ignore
      }
      process.exit(0);
    }, 100);
  } catch (error: any) {
    logger.error('❌ Error:', error);
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      // Ignore
    }
    process.exit(1);
  }
};

checkDatabase();


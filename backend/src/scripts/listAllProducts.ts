import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category'; // Import Category model so it's registered
import { connectDatabase } from '../utils/database';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const listAllProducts = async () => {
  try {
    logger.info('📋 Listing all products in database...\n');
    
    // Connect to database
    await connectDatabase();
    
    // First, get a count of all products using MongoDB directly to bypass any Mongoose filters
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    const productsCollection = db.collection('products');
    const totalCount = await productsCollection.countDocuments({});
    
    logger.info(`Total products in database: ${totalCount}\n`);
    
    // If there are many products, only show first 50 and summary
    const allProducts = await Product.find({})
      .select('name slug brand category basePrice petType isActive inStock createdAt')
      .lean()
      .sort({ createdAt: -1 })
      .limit(50); // Limit to first 50 for display
    
    logger.info(`Retrieved ${allProducts.length} products for analysis (showing first 50 if more exist)\n`);
    
    if (allProducts.length === 0) {
      logger.info('No products found in database.\n');
    } else {
      logger.info('All products:\n');
      allProducts.forEach((product, index) => {
        logger.info(`${index + 1}. ${product.name}`);
        logger.info(`   Brand: ${product.brand}`);
        logger.info(`   Slug: ${product.slug}`);
        logger.info(`   Category ID: ${product.category}`);
        logger.info(`   Price: $${product.basePrice}`);
        logger.info(`   Pet Type: ${product.petType}`);
        logger.info(`   Active: ${product.isActive}, In Stock: ${product.inStock}`);
        logger.info(`   ID: ${product._id}`);
        logger.info(`   Created: ${product.createdAt}`);
        logger.info('');
      });
      
      // For duplicate detection, query ALL products (not just first 50)
    const allProductsForDuplicates = await Product.find({})
      .select('name slug brand _id createdAt')
      .lean();
    
    // Group by name+brand to show potential duplicates
      const grouped = new Map<string, any[]>();
      allProductsForDuplicates.forEach(p => {
        const key = `${String(p.name).toLowerCase().trim()}_${String(p.brand).toLowerCase().trim()}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(p);
      });
      
      const duplicates = Array.from(grouped.entries()).filter(([_, products]) => products.length > 1);
      
      // Also check slug duplicates
      const slugMap = new Map<string, any[]>();
      allProductsForDuplicates.forEach(p => {
        if (p.slug) {
          const slugKey = String(p.slug).toLowerCase();
          if (!slugMap.has(slugKey)) {
            slugMap.set(slugKey, []);
          }
          slugMap.get(slugKey)!.push(p);
        }
      });
      
      const slugDuplicates = Array.from(slugMap.entries()).filter(([_, products]) => products.length > 1);
      
      if (duplicates.length > 0) {
        logger.info(`\n⚠️  Found ${duplicates.length} duplicate groups (same name + brand):\n`);
        // Show first 20 duplicate groups to avoid overwhelming output
        const toShow = duplicates.slice(0, 20);
        toShow.forEach(([key, products]) => {
          logger.info(`   "${key}" - ${products.length} products:`);
          products.forEach(p => {
            logger.info(`      - ID: ${p._id}, Slug: ${p.slug}, Created: ${p.createdAt}`);
          });
        });
        if (duplicates.length > 20) {
          logger.info(`   ... and ${duplicates.length - 20} more duplicate groups (run find-duplicates for full list)\n`);
        }
      }
      
      if (slugDuplicates.length > 0) {
        logger.info(`\n⚠️  Found ${slugDuplicates.length} duplicate groups (same slug):\n`);
        // Show first 10 slug duplicates
        const toShow = slugDuplicates.slice(0, 10);
        toShow.forEach(([slug, products]) => {
          logger.info(`   Slug: "${slug}" - ${products.length} products:`);
          products.forEach(p => {
            logger.info(`      - ID: ${p._id}, Name: "${p.name}", Brand: ${p.brand}, Created: ${p.createdAt}`);
          });
        });
        if (slugDuplicates.length > 10) {
          logger.info(`   ... and ${slugDuplicates.length - 10} more slug duplicates\n`);
        }
      }
      
      if (duplicates.length === 0 && slugDuplicates.length === 0 && totalCount > 0) {
        logger.info('✅ No duplicates detected in database!\n');
      }
    }
    
    // Close connection properly
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

listAllProducts();


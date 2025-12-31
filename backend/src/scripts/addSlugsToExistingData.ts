import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';
import { connectDatabase } from '../utils/database';
import logger from '../utils/logger';

/**
 * Adds slugs to existing products and categories that don't have them
 * Generates slugs from names and handles duplicate slug conflicts
 */
const addSlugsToExistingData = async () => {
  try {
    logger.info('🔄 Starting slug migration...');
    
    // Connect to database
    await connectDatabase();
    
    // Generate slugs for products without slugs
    const productsWithoutSlugs = await Product.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });
    
    logger.info(`📦 Found ${productsWithoutSlugs.length} products without slugs`);
    
    for (const product of productsWithoutSlugs) {
      if (product.name) {
        product.slug = product.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '');
        
        try {
          await product.save();
          logger.info(`✅ Updated product: ${product.name} -> ${product.slug}`);
        } catch (error: any) {
          if (error.code === 11000) {
            // Duplicate slug, add product ID to make it unique
            const productId = product._id as mongoose.Types.ObjectId;
            product.slug = `${product.slug}-${productId.toString().slice(-6)}`;
            await product.save();
            logger.info(`✅ Updated product (with ID): ${product.name} -> ${product.slug}`);
          } else {
            logger.error(`❌ Error updating product ${product.name}:`, error.message);
          }
        }
      }
    }
    
    // Generate slugs for categories without slugs
    const categoriesWithoutSlugs = await Category.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });
    
    logger.info(`📁 Found ${categoriesWithoutSlugs.length} categories without slugs`);
    
    for (const category of categoriesWithoutSlugs) {
      if (category.name) {
        category.slug = category.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '');
        
        try {
          await category.save();
          logger.info(`✅ Updated category: ${category.name} -> ${category.slug}`);
        } catch (error: any) {
          if (error.code === 11000) {
            // Duplicate slug, add category ID to make it unique
            const categoryId = category._id as mongoose.Types.ObjectId;
            category.slug = `${category.slug}-${categoryId.toString().slice(-6)}`;
            await category.save();
            logger.info(`✅ Updated category (with ID): ${category.name} -> ${category.slug}`);
          } else {
            logger.error(`❌ Error updating category ${category.name}:`, error.message);
          }
        }
      }
    }
    
    logger.info('✅ Slug migration completed!');
    logger.info(`   - Products updated: ${productsWithoutSlugs.length}`);
    logger.info(`   - Categories updated: ${categoriesWithoutSlugs.length}`);
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
addSlugsToExistingData();


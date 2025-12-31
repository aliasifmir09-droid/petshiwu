import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';
import { connectDatabase } from '../utils/database';
import logger from '../utils/logger';

dotenv.config();

/**
 * Script to fix product stock calculations for existing products
 * This recalculates totalStock and inStock from variants for all products
 */
const fixProductStock = async () => {
  try {
    await connectDatabase();
    logger.info('✅ Connected to database\n');

    const products = await Product.find({ deletedAt: null });
    logger.info(`📦 Found ${products.length} products to check\n`);

    let fixed = 0;
    let alreadyCorrect = 0;
    let errors = 0;

    for (const product of products) {
      try {
        let needsUpdate = false;
        let calculatedTotalStock = 0;
        let calculatedInStock = false;

        // Calculate total stock from variants
        if (product.variants && product.variants.length > 0) {
          calculatedTotalStock = product.variants.reduce((total, variant) => {
            const variantStock = variant.stock || 0;
            return total + variantStock;
          }, 0);
          calculatedInStock = calculatedTotalStock > 0;
        } else {
          // If no variants, use existing totalStock or default to 0
          calculatedTotalStock = product.totalStock || 0;
          calculatedInStock = calculatedTotalStock > 0;
        }

        // Check if update is needed
        if (product.totalStock !== calculatedTotalStock || product.inStock !== calculatedInStock) {
          needsUpdate = true;
        }

        if (needsUpdate) {
          product.totalStock = calculatedTotalStock;
          product.inStock = calculatedInStock;
          await product.save();
          fixed++;
          logger.info(`✅ Fixed: ${product.name} - Stock: ${calculatedTotalStock}, InStock: ${calculatedInStock}`);
        } else {
          alreadyCorrect++;
        }
      } catch (error: any) {
        errors++;
        logger.error(`❌ Error fixing product ${product.name}:`, error.message);
      }
    }

    logger.info('\n📊 Summary:');
    logger.info(`   Fixed: ${fixed}`);
    logger.info(`   Already correct: ${alreadyCorrect}`);
    logger.info(`   Errors: ${errors}`);
    logger.info(`   Total: ${products.length}`);

    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  fixProductStock();
}

export default fixProductStock;


import mongoose from 'mongoose';
import { connectDatabase } from '../utils/database';
import Product from '../models/Product';
import Category from '../models/Category';
import logger from '../utils/logger';

/**
 * Script to fix Small Pet products by updating their petType to "small-pet"
 * This script will:
 * 1. Find products that should be Small Pet products (based on category or other criteria)
 * 2. Update their petType to "small-pet"
 */
const fixSmallPetProducts = async () => {
  try {
    logger.info('🔧 Fixing Small Pet products...\n');
    
    await connectDatabase();
    logger.info('✅ Connected to database\n');

    // First, show all products that might need fixing
    // Look for products in categories that contain "small" or are related to small pets
    const allProducts = await Product.find({})
      .select('name slug petType category')
      .limit(100)
      .lean();
    
    logger.info(`📦 Found ${allProducts.length} products to check\n`);

    // Get all category IDs from products
    const categoryIds = allProducts
      .map((p: any) => p.category)
      .filter((id: any) => id && mongoose.Types.ObjectId.isValid(id))
      .map((id: any) => new mongoose.Types.ObjectId(id));
    
    // Fetch categories separately
    const categories = await Category.find({ _id: { $in: categoryIds } })
      .select('name slug petType')
      .lean();
    
    const categoryMap = new Map(categories.map((c: any) => [c._id.toString(), c]));

    // Show products that might be Small Pet products
    const potentialSmallPetProducts = allProducts.filter((p: any) => {
      const categoryId = p.category;
      const category = categoryId ? categoryMap.get(categoryId.toString()) : null;
      const categoryName = category ? category.name : '';
      const categoryPetType = category ? category.petType : '';
      
      // Check if category name or petType suggests it's a small pet product
      const isSmallPetCategory = categoryName && (
        categoryName.toLowerCase().includes('small') ||
        categoryName.toLowerCase().includes('rabbit') ||
        categoryName.toLowerCase().includes('hamster') ||
        categoryName.toLowerCase().includes('guinea')
      );
      
      return isSmallPetCategory || categoryPetType === 'small-pet';
    });

    if (potentialSmallPetProducts.length > 0) {
      logger.info(`🔍 Found ${potentialSmallPetProducts.length} potential Small Pet products:\n`);
      potentialSmallPetProducts.forEach((p: any, i: number) => {
        const categoryId = p.category;
        const category = categoryId ? categoryMap.get(categoryId.toString()) : null;
        const categoryName = category ? category.name : 'N/A';
        logger.info(`   ${i + 1}. ${p.name} (slug: ${p.slug}, current petType: ${p.petType}, category: ${categoryName})`);
      });
      logger.info('');

      // Ask user to confirm (in a real scenario, you'd want to be more careful)
      // For now, we'll update products that are clearly in small pet categories
      logger.info('🔄 Updating petType to "small-pet" for these products...\n');
      
      const productIds = potentialSmallPetProducts.map((p: any) => p._id);
      const result = await Product.updateMany(
        { _id: { $in: productIds } },
        { $set: { petType: 'small-pet' } }
      );
      
      logger.info(`✅ Updated ${result.modifiedCount} products to petType: "small-pet"\n`);
    } else {
      logger.warn('⚠️  No products found that match Small Pet criteria.\n');
      logger.info('💡 You may need to manually update products in the admin dashboard.\n');
      logger.info('   Or specify product slugs to update in this script.\n');
    }

    // Show final state
    const smallPetProducts = await Product.find({ petType: 'small-pet' })
      .select('name slug petType')
      .lean();
    
    logger.info(`📊 Final count: ${smallPetProducts.length} products with petType: "small-pet"\n`);

    await mongoose.connection.close();
    logger.info('✅ Fix complete');
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error fixing Small Pet products:', error);
    process.exit(1);
  }
};

fixSmallPetProducts();


import mongoose from 'mongoose';
import { connectDatabase } from '../utils/database';
import Product from '../models/Product';
import PetType from '../models/PetType';
import logger from '../utils/logger';

/**
 * Script to check Small Pet products and petType values
 */
const checkSmallPetProducts = async () => {
  try {
    logger.info('🔍 Checking Small Pet products and petType values...\n');
    
    await connectDatabase();
    logger.info('✅ Connected to database\n');

    // Get Small Pet pet type from database
    const smallPetType = await PetType.findOne({ 
      $or: [
        { name: 'Small Pet' },
        { slug: 'small-pet' }
      ]
    }).lean();
    
    if (smallPetType) {
      logger.info(`✅ Found Small Pet type: ${JSON.stringify(smallPetType, null, 2)}\n`);
    } else {
      logger.warn(`⚠️  Small Pet type NOT FOUND in database!\n`);
    }

    // Check all products with various small pet related petType values
    const petTypeVariations = ['small-pet', 'small pet', 'Small Pet', 'smallpet', 'smallPet'];
    
    for (const petTypeValue of petTypeVariations) {
      const products = await Product.find({ petType: petTypeValue })
        .select('name slug petType category')
        .limit(10)
        .lean();
      
      if (products.length > 0) {
        logger.info(`📦 Found ${products.length} products with petType: "${petTypeValue}"`);
        products.forEach((p, i) => {
          logger.info(`   ${i + 1}. ${p.name} (slug: ${p.slug}, petType: ${p.petType})`);
        });
        logger.info('');
      }
    }

    // Get all unique petType values in products
    const allPetTypes = await Product.distinct('petType');
    logger.info(`📊 All unique petType values in products: ${JSON.stringify(allPetTypes, null, 2)}\n`);

    // Count products by petType
    const petTypeCounts = await Product.aggregate([
      {
        $group: {
          _id: '$petType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    logger.info('📈 Product counts by petType:');
    petTypeCounts.forEach((item) => {
      logger.info(`   ${item._id}: ${item.count} products`);
    });

    await mongoose.connection.close();
    logger.info('\n✅ Check complete');
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error checking Small Pet products:', error);
    process.exit(1);
  }
};

checkSmallPetProducts();


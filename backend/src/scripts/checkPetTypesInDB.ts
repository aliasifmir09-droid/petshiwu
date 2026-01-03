import mongoose from 'mongoose';
import { connectDatabase } from '../utils/database';
import PetType from '../models/PetType';
import logger from '../utils/logger';

/**
 * Quick script to check all pet types in database
 */
const checkPetTypes = async () => {
  try {
    logger.info('🔍 Checking pet types in database...\n');
    
    await connectDatabase();
    logger.info('✅ Connected to database\n');

    // Get all pet types (no filters)
    const allPetTypes = await PetType.find().sort({ order: 1, name: 1 }).lean();
    
    logger.info(`📊 Found ${allPetTypes.length} pet types in database:\n`);
    allPetTypes.forEach((pt, index) => {
      logger.info(`${index + 1}. ${pt.name} (slug: ${pt.slug}, active: ${pt.isActive}, order: ${pt.order})`);
    });
    
    // Check specifically for Small Pet
    const smallPet = await PetType.findOne({ 
      $or: [
        { name: 'Small Pet' },
        { name: 'Small Pets' },
        { slug: 'small-pet' },
        { slug: 'small-pets' }
      ]
    }).lean();
    
    if (smallPet) {
      logger.info(`\n✅ Found "Small Pet": ${JSON.stringify(smallPet, null, 2)}`);
    } else {
      logger.warn(`\n⚠️  "Small Pet" NOT FOUND in database!`);
      logger.info('   Searching for similar names...');
      const similar = await PetType.find({
        $or: [
          { name: { $regex: /small/i } },
          { slug: { $regex: /small/i } }
        ]
      }).lean();
      if (similar.length > 0) {
        logger.info(`   Found similar: ${similar.map(s => `${s.name} (${s.slug})`).join(', ')}`);
      }
    }
    
    // Check for "Other Animals" which might be the 7th pet type
    const otherAnimals = await PetType.findOne({ 
      $or: [
        { name: 'Other Animals' },
        { name: 'Other Animal' },
        { slug: 'other-animals' },
        { slug: 'other-animal' }
      ]
    }).lean();
    
    if (otherAnimals) {
      logger.info(`\n✅ Found "Other Animals": ${JSON.stringify(otherAnimals, null, 2)}`);
    } else {
      logger.warn(`\n⚠️  "Other Animals" NOT FOUND in database!`);
      logger.info('   This might be the missing 7th pet type.');
    }

    await mongoose.connection.close();
    logger.info('\n✅ Check complete');
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error checking pet types:', error);
    process.exit(1);
  }
};

checkPetTypes();


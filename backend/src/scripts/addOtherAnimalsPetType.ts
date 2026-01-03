import mongoose from 'mongoose';
import { connectDatabase } from '../utils/database';
import PetType from '../models/PetType';
import logger from '../utils/logger';

/**
 * Script to add "Other Animals" pet type if it doesn't exist
 */
const addOtherAnimals = async () => {
  try {
    logger.info('🔍 Checking for "Other Animals" pet type...\n');
    
    await connectDatabase();
    logger.info('✅ Connected to database\n');

    // Check if "Other Animals" already exists
    const existing = await PetType.findOne({ 
      $or: [
        { name: 'Other Animals' },
        { slug: 'other-animals' }
      ]
    }).lean();
    
    if (existing) {
      logger.info(`✅ "Other Animals" already exists:`);
      logger.info(`   Name: ${existing.name}`);
      logger.info(`   Slug: ${existing.slug}`);
      logger.info(`   Active: ${existing.isActive}`);
      logger.info(`   Order: ${existing.order}`);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Get the highest order value to place "Other Animals" at the end
    const lastPetType = await PetType.findOne().sort({ order: -1 }).select('order').lean();
    const nextOrder = lastPetType && lastPetType.order !== undefined ? lastPetType.order + 1 : 7;

    logger.info(`📝 Creating "Other Animals" pet type with order ${nextOrder}...`);

    const otherAnimals = await PetType.create({
      name: 'Other Animals',
      slug: 'other-animals',
      icon: '🐾',
      description: 'Birds, Fish, Small Pets, Reptiles & More',
      isActive: true,
      order: nextOrder
    });

    logger.info(`\n✅ Successfully created "Other Animals" pet type!`);
    logger.info(`   ID: ${otherAnimals._id}`);
    logger.info(`   Name: ${otherAnimals.name}`);
    logger.info(`   Slug: ${otherAnimals.slug}`);
    logger.info(`   Order: ${otherAnimals.order}`);

    // Verify it was created
    const allPetTypes = await PetType.find().sort({ order: 1, name: 1 }).lean();
    logger.info(`\n📊 Total pet types in database: ${allPetTypes.length}`);
    allPetTypes.forEach((pt, index) => {
      logger.info(`   ${index + 1}. ${pt.name} (order: ${pt.order})`);
    });

    await mongoose.connection.close();
    logger.info('\n✅ Complete');
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error adding "Other Animals" pet type:', error);
    if (error.code === 11000) {
      logger.error('   Duplicate key error - "Other Animals" might already exist with a different name/slug');
    }
    process.exit(1);
  }
};

addOtherAnimals();


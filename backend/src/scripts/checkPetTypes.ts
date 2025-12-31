import mongoose from 'mongoose';
import { connectDatabase } from '../utils/database';
import PetType from '../models/PetType';
import logger from '../utils/logger';

/**
 * Checks and displays all pet types in the database
 * Also checks for the existence of "other-animals" pet type
 */
const checkPetTypes = async () => {
  try {
    await connectDatabase();
    logger.info('✅ Connected to database\n');

    const petTypes = await PetType.find().sort({ order: 1 });

    logger.info(`📊 Found ${petTypes.length} pet types:\n`);
    
    petTypes.forEach((pt, index) => {
      logger.info(`${index + 1}. ${pt.icon} ${pt.name}`);
      logger.info(`   - Slug: ${pt.slug}`);
      logger.info(`   - Active: ${pt.isActive ? '✅ Yes' : '❌ No'}`);
      logger.info(`   - Order: ${pt.order}`);
      logger.info('');
    });

    // Check specifically for "other-animals"
    const otherAnimals = petTypes.find(pt => pt.slug === 'other-animals');
    
    if (otherAnimals) {
      logger.info('✅ "Other Animals" pet type exists!');
      logger.info(`   Active: ${otherAnimals.isActive ? 'Yes' : 'No (You need to activate it!)'}`);
    } else {
      logger.info('❌ "Other Animals" pet type NOT FOUND!');
      logger.info('   Please create it from the Pet Types admin page.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error:', error);
    process.exit(1);
  }
};

checkPetTypes();


import mongoose from 'mongoose';
import { connectDatabase } from '../utils/database';
import PetType from '../models/PetType';
import logger from '../utils/logger';

const defaultPetTypes = [
  {
    name: 'Dog',
    slug: 'dog',
    icon: '🐕',
    description: 'Products for dogs of all sizes and breeds',
    isActive: true,
    order: 1
  },
  {
    name: 'Cat',
    slug: 'cat',
    icon: '🐈',
    description: 'Products for cats and kittens',
    isActive: true,
    order: 2
  },
  {
    name: 'Bird',
    slug: 'bird',
    icon: '🐦',
    description: 'Products for birds and avian pets',
    isActive: true,
    order: 3
  },
  {
    name: 'Fish',
    slug: 'fish',
    icon: '🐠',
    description: 'Products for aquarium and fish care',
    isActive: true,
    order: 4
  },
  {
    name: 'Small Pet',
    slug: 'small-pet',
    icon: '🐹',
    description: 'Products for rabbits, hamsters, guinea pigs, and more',
    isActive: true,
    order: 5
  },
  {
    name: 'Reptile',
    slug: 'reptile',
    icon: '🦎',
    description: 'Products for reptiles and amphibians',
    isActive: true,
    order: 6
  }
];

/**
 * Seeds the database with default pet types
 * Skips seeding if pet types already exist
 */
const seedPetTypes = async () => {
  try {
    await connectDatabase();
    logger.info('✅ Connected to database');

    // Check if pet types already exist
    const existingCount = await PetType.countDocuments();
    
    if (existingCount > 0) {
      logger.info(`✅ Pet types already exist (${existingCount} types found)`);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create default pet types
    await PetType.insertMany(defaultPetTypes);
    logger.info('✅ Successfully seeded default pet types:');
    defaultPetTypes.forEach(pt => logger.info(`  - ${pt.icon} ${pt.name}`));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding pet types:', error);
    process.exit(1);
  }
};

seedPetTypes();


import mongoose from 'mongoose';
import { connectDatabase } from './database';
import PetType from '../models/PetType';

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

const seedPetTypes = async () => {
  try {
    await connectDatabase();
    console.log('✅ Connected to database');

    // Check if pet types already exist
    const existingCount = await PetType.countDocuments();
    
    if (existingCount > 0) {
      console.log(`✅ Pet types already exist (${existingCount} types found)`);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create default pet types
    await PetType.insertMany(defaultPetTypes);
    console.log('✅ Successfully seeded default pet types:');
    defaultPetTypes.forEach(pt => console.log(`  - ${pt.icon} ${pt.name}`));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding pet types:', error);
    process.exit(1);
  }
};

seedPetTypes();


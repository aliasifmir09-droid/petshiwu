import mongoose from 'mongoose';
import { connectDatabase } from './database';
import PetType from '../models/PetType';

const checkPetTypes = async () => {
  try {
    await connectDatabase();
    console.log('✅ Connected to database\n');

    const petTypes = await PetType.find().sort({ order: 1 });

    console.log(`📊 Found ${petTypes.length} pet types:\n`);
    
    petTypes.forEach((pt, index) => {
      console.log(`${index + 1}. ${pt.icon} ${pt.name}`);
      console.log(`   - Slug: ${pt.slug}`);
      console.log(`   - Active: ${pt.isActive ? '✅ Yes' : '❌ No'}`);
      console.log(`   - Order: ${pt.order}`);
      console.log('');
    });

    // Check specifically for "other-animals"
    const otherAnimals = petTypes.find(pt => pt.slug === 'other-animals');
    
    if (otherAnimals) {
      console.log('✅ "Other Animals" pet type exists!');
      console.log(`   Active: ${otherAnimals.isActive ? 'Yes' : 'No (You need to activate it!)'}`);
    } else {
      console.log('❌ "Other Animals" pet type NOT FOUND!');
      console.log('   Please create it from the Pet Types admin page.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkPetTypes();


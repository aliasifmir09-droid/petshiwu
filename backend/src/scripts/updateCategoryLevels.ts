import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category';
import { connectDatabase } from '../utils/database';

dotenv.config();

/**
 * Migration script to calculate and set level for all existing categories
 * Level 1: No parent (root categories)
 * Level 2: Has parent at level 1
 * Level 3: Has parent at level 2
 */
const updateCategoryLevels = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDatabase();

    console.log('📋 Fetching all categories...');
    const categories = await Category.find({}).lean();
    
    if (categories.length === 0) {
      console.log('✓ No categories found');
      mongoose.connection.close();
      return;
    }

    console.log(`Found ${categories.length} categories`);
    console.log('\n🔧 Calculating levels...\n');

    // Create a map for quick lookups
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat._id.toString(), cat);
    });

    // Function to calculate level recursively
    const calculateLevel = (category: any, visited = new Set()): number => {
      const catId = category._id.toString();
      
      // Prevent infinite loops
      if (visited.has(catId)) {
        console.warn(`⚠️  Circular reference detected for category: ${category.name}`);
        return 1;
      }
      
      visited.add(catId);
      
      if (!category.parentCategory) {
        return 1; // Root category
      }

      const parent = categoryMap.get(category.parentCategory.toString());
      if (!parent) {
        return 1; // Parent not found, treat as root
      }

      return calculateLevel(parent, visited) + 1;
    };

    let updated = 0;
    let errors = 0;

    for (const category of categories) {
      try {
        const calculatedLevel = calculateLevel(category);
        
        // Direct update using findByIdAndUpdate
        await Category.findByIdAndUpdate(
          category._id,
          { level: calculatedLevel },
          { runValidators: false }
        );
        
        console.log(`✓ Set "${category.name}" (${category.petType}) to level ${calculatedLevel}`);
        updated++;
      } catch (error: any) {
        console.error(`❌ Error updating "${category.name}":`, error.message);
        errors++;
      }
    }

    console.log('\n✅ Migration complete!');
    console.log(`   Updated: ${updated} categories`);
    console.log(`   Unchanged: ${categories.length - updated - errors} categories`);
    if (errors > 0) {
      console.log(`   Errors: ${errors} categories`);
    }

    // Show level distribution
    const levelCounts = await Category.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 Category distribution by level:');
    levelCounts.forEach((item) => {
      console.log(`   Level ${item._id}: ${item.count} categories`);
    });

  } catch (error: any) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

updateCategoryLevels();


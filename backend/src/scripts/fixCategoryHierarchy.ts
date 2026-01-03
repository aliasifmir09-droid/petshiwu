import mongoose from 'mongoose';
import Category from '../models/Category';
import Product from '../models/Product';
import PetType from '../models/PetType';
import { connectDatabase } from '../utils/database';
import dotenv from 'dotenv';
import * as readline from 'readline';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

interface CategoryFix {
  incorrectCategory: {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    petType: string;
    level: number;
    productCount: number;
    childCategories: Array<{
      _id: mongoose.Types.ObjectId;
      name: string;
      slug: string;
      level: number;
      childCount: number;
    }>;
  };
  targetCategory: {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    level: number;
  } | null;
  petTypeMatch: {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
  };
}

/**
 * Fixes category hierarchy where pet type names were incorrectly created as categories
 * Usage: npm run script:fix-category-hierarchy
 */
const fixCategoryHierarchy = async () => {
  try {
    logger.info('\n' + '='.repeat(60));
    logger.info('🔧 Fix Category Hierarchy (Remove Pet Type Categories)');
    logger.info('='.repeat(60) + '\n');

    // Enable command buffering for scripts (allows queries before connection is ready)
    mongoose.set('bufferCommands', true);
    
    // Connect to database
    await connectDatabase();
    
    // Wait for connection to be ready (with timeout)
    if (mongoose.connection.readyState !== 1) {
      logger.info('⏳ Waiting for MongoDB connection...');
      let connectionReady = false;
      
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (!connectionReady) {
              reject(new Error('Connection timeout: MongoDB did not connect within 30 seconds. Please check your MONGODB_URI in .env file.'));
            }
          }, 30000);
          
          const checkConnection = () => {
            if (mongoose.connection.readyState === 1) {
              connectionReady = true;
              clearTimeout(timeout);
              mongoose.connection.removeListener('connected', checkConnection);
              resolve();
            }
          };
          
          // Check immediately
          if (mongoose.connection.readyState === 1) {
            connectionReady = true;
            clearTimeout(timeout);
            resolve();
          } else {
            // Wait for connection event
            mongoose.connection.once('connected', checkConnection);
            
            // Also poll every 100ms as fallback
            const pollInterval = setInterval(() => {
              if (mongoose.connection.readyState === 1) {
                connectionReady = true;
                clearInterval(pollInterval);
                clearTimeout(timeout);
                mongoose.connection.removeListener('connected', checkConnection);
                resolve();
              }
            }, 100);
            
            // Clean up polling on timeout
            setTimeout(() => {
              clearInterval(pollInterval);
            }, 30000);
          }
        });
      } catch (error: any) {
        logger.error(`❌ Failed to connect to MongoDB: ${error.message}`);
        logger.error('\n🔧 Please check:');
        logger.error('1. MongoDB is running');
        logger.error('2. MONGODB_URI in .env file is correct');
        logger.error('3. Network connectivity to MongoDB server\n');
        await mongoose.connection.close();
        process.exit(1);
      }
    }
    
    // Verify connection is actually ready
    if (mongoose.connection.readyState !== 1) {
      logger.error('❌ MongoDB connection is not ready. Cannot proceed.');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    logger.info('✅ Connected to MongoDB\n');

    // Fetch all pet types
    const petTypes = await PetType.find({ isActive: true })
      .select('name slug')
      .lean();
    
    if (petTypes.length === 0) {
      logger.info('ℹ️  No active pet types found. Nothing to fix.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    logger.info(`📋 Found ${petTypes.length} active pet type(s): ${petTypes.map(pt => pt.name).join(', ')}\n`);

    // Find categories that match pet type names (case-insensitive)
    const petTypeNames = petTypes.map(pt => pt.name.toLowerCase());
    const petTypeSlugs = petTypes.map(pt => pt.slug.toLowerCase());

    const incorrectCategories = await Category.find({
      $or: [
        { name: { $in: petTypeNames.map(name => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) } },
        { slug: { $in: petTypeSlugs } }
      ],
      isActive: true // Only active categories
    })
      .select('name slug petType level parentCategory')
      .lean();

    if (incorrectCategories.length === 0) {
      logger.info('✅ No incorrect categories found. All categories are properly structured.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    logger.info(`⚠️  Found ${incorrectCategories.length} category/categories that match pet type names:\n`);

    // Build fix plan for each incorrect category
    const fixes: CategoryFix[] = [];

    for (const incorrectCat of incorrectCategories) {
      const categoryId = incorrectCat._id as mongoose.Types.ObjectId;
      const categoryName = incorrectCat.name;
      const categorySlug = incorrectCat.slug || '';

      // Find matching pet type
      const matchingPetType = petTypes.find(
        pt => pt.name.toLowerCase() === categoryName.toLowerCase() || 
              pt.slug.toLowerCase() === categorySlug.toLowerCase()
      );

      if (!matchingPetType) {
        logger.warn(`⚠️  Could not find matching pet type for category: ${categoryName}`);
        continue;
      }

      // Count products in this category
      const productCount = await Product.countDocuments({
        category: categoryId,
        deletedAt: null
      });

      // Find child categories
      const childCategories = await Category.find({
        parentCategory: categoryId,
        isActive: true
      })
        .select('name slug level')
        .sort({ level: 1, name: 1 })
        .lean();

      // Get child count for each child category
      const childCategoriesWithCounts = await Promise.all(
        childCategories.map(async (child) => {
          const childId = child._id as mongoose.Types.ObjectId;
          const childCount = await Category.countDocuments({
            parentCategory: childId,
            isActive: true
          });
          return {
            _id: childId,
            name: child.name,
            slug: child.slug || '',
            level: child.level || 1,
            childCount
          };
        })
      );

      // Determine target category (first child, or null if no children)
      let targetCategory: CategoryFix['targetCategory'] = null;
      if (childCategoriesWithCounts.length > 0) {
        const firstChild = childCategoriesWithCounts[0];
        targetCategory = {
          _id: firstChild._id,
          name: firstChild.name,
          slug: firstChild.slug,
          level: firstChild.level
        };
      }

      fixes.push({
        incorrectCategory: {
          _id: categoryId,
          name: categoryName,
          slug: categorySlug,
          petType: incorrectCat.petType || 'all',
          level: incorrectCat.level || 1,
          productCount,
          childCategories: childCategoriesWithCounts
        },
        targetCategory,
        petTypeMatch: {
          _id: matchingPetType._id as mongoose.Types.ObjectId,
          name: matchingPetType.name,
          slug: matchingPetType.slug
        }
      });
    }

    // Display fix plan
    logger.info('📋 Fix Plan:\n');
    logger.info('='.repeat(60));
    
    fixes.forEach((fix, idx) => {
      logger.info(`\n${idx + 1}. Category: "${fix.incorrectCategory.name}"`);
      logger.info(`   Pet Type Match: ${fix.petTypeMatch.name} (${fix.petTypeMatch.slug})`);
      logger.info(`   Current Level: ${fix.incorrectCategory.level}`);
      logger.info(`   Products: ${fix.incorrectCategory.productCount}`);
      logger.info(`   Child Categories: ${fix.incorrectCategory.childCategories.length}`);
      
      if (fix.incorrectCategory.childCategories.length > 0) {
        logger.info(`   Child Categories:`);
        fix.incorrectCategory.childCategories.forEach((child, childIdx) => {
          logger.info(`      ${childIdx + 1}. ${child.name} (Level ${child.level}, ${child.childCount} sub-children)`);
        });
      }

      if (fix.targetCategory) {
        logger.info(`\n   ✅ Will reassign ${fix.incorrectCategory.productCount} product(s) to: "${fix.targetCategory.name}"`);
        logger.info(`   ✅ Will promote "${fix.targetCategory.name}" to root level (Level 1)`);
        
        // Update children of target category
        if (fix.incorrectCategory.childCategories.length > 1) {
          logger.info(`   ✅ Will update ${fix.incorrectCategory.childCategories.length - 1} sibling category/categories`);
        }
        
        // Update grandchildren
        const totalGrandchildren = fix.incorrectCategory.childCategories.reduce(
          (sum, child) => sum + child.childCount, 0
        );
        if (totalGrandchildren > 0) {
          logger.info(`   ✅ Will update ${totalGrandchildren} grandchild category/categories`);
        }
      } else {
        logger.info(`\n   ⚠️  WARNING: No child categories found!`);
        logger.info(`   ⚠️  Products will be unassigned (category set to null)`);
        logger.info(`   ⚠️  This category will be deleted`);
      }
      
      logger.info(`   🗑️  Will delete category: "${fix.incorrectCategory.name}"`);
    });

    logger.info('\n' + '='.repeat(60) + '\n');

    // Check for edge cases
    const categoriesWithoutChildren = fixes.filter(f => !f.targetCategory);
    if (categoriesWithoutChildren.length > 0) {
      logger.warn(`⚠️  WARNING: ${categoriesWithoutChildren.length} category/categories have no children!`);
      logger.warn(`   Products in these categories will be unassigned (category = null).\n`);
    }

    // Create readline interface for user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Confirmation prompt
    const answer = await new Promise<string>((resolve) => {
      rl.question(`⚠️  Are you sure you want to proceed with fixing ${fixes.length} category/categories? Type "YES" to confirm: `, (input) => {
        rl.close();
        resolve(input.trim());
      });
    });

    if (answer !== 'YES') {
      logger.info('\n❌ Fix cancelled. No changes were made.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    logger.info('\n🔧 Starting fix process...\n');

    // Execute fixes
    let totalProductsReassigned = 0;
    let totalCategoriesPromoted = 0;
    let totalCategoriesDeleted = 0;
    let totalCategoriesUpdated = 0;

    for (const fix of fixes) {
      const incorrectCategoryId = fix.incorrectCategory._id;
      const incorrectCategoryName = fix.incorrectCategory.name;

      logger.info(`\n📦 Processing: "${incorrectCategoryName}"`);

      if (fix.targetCategory) {
        const targetCategoryId = fix.targetCategory._id;
        const targetCategoryName = fix.targetCategory.name;

        // Step 1: Reassign products from incorrect category to target category
        if (fix.incorrectCategory.productCount > 0) {
          const productUpdateResult = await Product.updateMany(
            {
              category: incorrectCategoryId,
              deletedAt: null
            },
            {
              $set: { category: targetCategoryId }
            }
          );
          totalProductsReassigned += productUpdateResult.modifiedCount;
          logger.info(`   ✅ Reassigned ${productUpdateResult.modifiedCount} product(s) to "${targetCategoryName}"`);
        }

        // Step 2: Promote target category to root level (Level 1)
        await Category.findByIdAndUpdate(targetCategoryId, {
          $set: {
            parentCategory: null,
            level: 1
          }
        });
        totalCategoriesPromoted++;
        logger.info(`   ✅ Promoted "${targetCategoryName}" to root level (Level 1)`);

        // Step 3: Update sibling categories (other children of incorrect category)
        // Make them children of the target category
        if (fix.incorrectCategory.childCategories.length > 1) {
          const siblingIds = fix.incorrectCategory.childCategories
            .slice(1) // Skip first child (target category)
            .map(child => child._id);

          if (siblingIds.length > 0) {
            // Update parent and level for siblings
            const siblingUpdateResult = await Category.updateMany(
              { _id: { $in: siblingIds }, isActive: true },
              {
                $set: {
                  parentCategory: targetCategoryId,
                  level: 2 // They become level 2 (children of target)
                }
              }
            );
            totalCategoriesUpdated += siblingUpdateResult.modifiedCount;
            logger.info(`   ✅ Updated ${siblingUpdateResult.modifiedCount} sibling category/categories`);
          }
        }

        // Step 4: Update grandchildren (children of target and siblings)
        // They need to have their level updated
        for (const child of fix.incorrectCategory.childCategories) {
          if (child.childCount > 0) {
            const grandchildren = await Category.find({
              parentCategory: child._id,
              isActive: true
            }).select('_id').lean();

            if (grandchildren.length > 0) {
              const grandchildIds = grandchildren.map(gc => gc._id as mongoose.Types.ObjectId);
              
              // Determine new level based on parent
              // If parent is now target (level 1), grandchildren become level 2
              // If parent is a sibling (level 2), grandchildren become level 3
              const newLevel = child._id.toString() === targetCategoryId.toString() ? 2 : 3;

              await Category.updateMany(
                { _id: { $in: grandchildIds }, isActive: true },
                { $set: { level: newLevel } }
              );
              totalCategoriesUpdated += grandchildren.length;
              logger.info(`   ✅ Updated ${grandchildren.length} grandchild category/categories under "${child.name}"`);
            }
          }
        }
      } else {
        // No child categories - unassign products
        if (fix.incorrectCategory.productCount > 0) {
          await Product.updateMany(
            {
              category: incorrectCategoryId,
              deletedAt: null
            },
            {
              $set: { category: null }
            }
          );
          logger.warn(`   ⚠️  Unassigned ${fix.incorrectCategory.productCount} product(s) (no target category)`);
        }
      }

      // Step 5: Delete the incorrect category
      // First, ensure no products or child categories are still using it
      const remainingProducts = await Product.countDocuments({
        category: incorrectCategoryId,
        deletedAt: null
      });
      const remainingChildren = await Category.countDocuments({
        parentCategory: incorrectCategoryId,
        isActive: true
      });

      if (remainingProducts > 0 || remainingChildren > 0) {
        logger.warn(`   ⚠️  Warning: Category "${incorrectCategoryName}" still has ${remainingProducts} product(s) and ${remainingChildren} child category/categories. Skipping deletion.`);
      } else {
        await Category.findByIdAndDelete(incorrectCategoryId);
        totalCategoriesDeleted++;
        logger.info(`   🗑️  Deleted category: "${incorrectCategoryName}"`);
      }
    }

    // Summary
    logger.info('\n' + '='.repeat(60));
    logger.info('📊 Fix Summary:');
    logger.info(`   ✅ Products reassigned: ${totalProductsReassigned}`);
    logger.info(`   ✅ Categories promoted: ${totalCategoriesPromoted}`);
    logger.info(`   ✅ Categories updated: ${totalCategoriesUpdated}`);
    logger.info(`   🗑️  Categories deleted: ${totalCategoriesDeleted}`);
    logger.info('='.repeat(60) + '\n');

    // Verify: Check if any incorrect categories still exist
    const remainingIncorrect = await Category.countDocuments({
      $or: [
        { name: { $in: petTypeNames.map(name => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) } },
        { slug: { $in: petTypeSlugs } }
      ],
      isActive: true
    });

    if (remainingIncorrect === 0) {
      logger.info('✅ Success! All incorrect categories have been fixed.\n');
    } else {
      logger.warn(`⚠️  Warning: ${remainingIncorrect} incorrect category/categories still remain.\n`);
    }

    // Close connection
    await mongoose.connection.close();
    logger.info('✅ Database connection closed\n');

    return {
      success: true,
      productsReassigned: totalProductsReassigned,
      categoriesPromoted: totalCategoriesPromoted,
      categoriesUpdated: totalCategoriesUpdated,
      categoriesDeleted: totalCategoriesDeleted
    };
  } catch (error: any) {
    logger.error('❌ Fix failed:', error.message);
    logger.error(error.stack);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  fixCategoryHierarchy()
    .then(() => {
      logger.info('✅ Operation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n❌ Operation failed:', error);
      process.exit(1);
    });
}

export default fixCategoryHierarchy;


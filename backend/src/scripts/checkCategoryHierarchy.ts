import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';
import { connectDatabase } from '../utils/database';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

/**
 * Diagnostic script to check category hierarchy and product visibility
 * This helps debug why products in nested categories aren't showing up
 */
const checkCategoryHierarchy = async () => {
  try {
    logger.info('\n' + '='.repeat(60));
    logger.info('🔍 Category Hierarchy Diagnostic');
    logger.info('='.repeat(60) + '\n');

    await connectDatabase();
    logger.info('✅ Connected to MongoDB\n');

    // Check for "Supplies" category and its hierarchy
    const suppliesCategory = await Category.findOne({
      name: { $regex: /^supplies$/i },
      petType: 'dog'
    }).lean();

    if (!suppliesCategory) {
      logger.warn('⚠️  "Supplies" category not found for Dog petType');
      logger.info('Searching for any category containing "supplies"...\n');
      
      const allSupplies = await Category.find({
        name: { $regex: /supplies/i }
      }).select('name slug petType parentCategory level').lean();
      
      if (allSupplies.length > 0) {
        logger.info(`Found ${allSupplies.length} category(ies) with "supplies" in name:`);
        allSupplies.forEach((cat: any) => {
          logger.info(`  - ${cat.name} (${cat.petType}) - Level ${cat.level || 'N/A'}`);
        });
      }
    } else {
      logger.info(`✅ Found "Supplies" category: ${suppliesCategory.name} (ID: ${suppliesCategory._id})`);
      logger.info(`   PetType: ${suppliesCategory.petType}, Level: ${suppliesCategory.level || 'N/A'}\n`);

      // Find all subcategories
      const buildHierarchy = async (categoryId: mongoose.Types.ObjectId, level: number = 1): Promise<any> => {
        const category = await Category.findById(categoryId).lean();
        if (!category) return null;

        const children = await Category.find({
          parentCategory: categoryId
        }).select('name slug petType level').lean();

        const result: any = {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          petType: category.petType,
          level: category.level || level,
          subcategories: []
        };

        for (const child of children) {
          const childHierarchy = await buildHierarchy(child._id as mongoose.Types.ObjectId, level + 1);
          if (childHierarchy) {
            result.subcategories.push(childHierarchy);
          }
        }

        return result;
      };

      logger.info('📁 Category Hierarchy:');
      const hierarchy = await buildHierarchy(suppliesCategory._id as mongoose.Types.ObjectId);
      const printHierarchy = (cat: any, indent: string = '') => {
        logger.info(`${indent}${cat.name} (Level ${cat.level}) [${cat.slug}]`);
        const productCount = 0; // Will count later
        logger.info(`${indent}  └─ Products: ${productCount} (will count...)`);
        
        if (cat.subcategories && cat.subcategories.length > 0) {
          cat.subcategories.forEach((sub: any) => {
            printHierarchy(sub, indent + '  ');
          });
        }
      };
      printHierarchy(hierarchy);
      logger.info('');

      // Count products in Supplies and all its subcategories
      const findAllDescendantIds = async (categoryId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> => {
        const result: mongoose.Types.ObjectId[] = [categoryId];
        
        const directChildren = await Category.find({
          parentCategory: categoryId
        }).select('_id').lean();

        for (const child of directChildren) {
          const descendants = await findAllDescendantIds(child._id as mongoose.Types.ObjectId);
          result.push(...descendants);
        }

        return result;
      };

      const allCategoryIds = await findAllDescendantIds(suppliesCategory._id as mongoose.Types.ObjectId);
      logger.info(`📦 Category IDs to check: ${allCategoryIds.length} categories\n`);

      // Count products in each category
      logger.info('🔢 Product Count by Category:');
      for (const catId of allCategoryIds) {
        const cat = await Category.findById(catId).select('name slug level').lean();
        if (cat) {
          const productCount = await Product.countDocuments({
            category: catId,
            deletedAt: null
          });
          
          const indent = '  '.repeat((cat.level || 1) - 1);
          logger.info(`${indent}${cat.name} (${cat.slug}): ${productCount} products`);
          
          // Show sample products
          if (productCount > 0 && productCount <= 5) {
            const products = await Product.find({
              category: catId,
              deletedAt: null
            }).select('name slug petType').limit(5).lean();
            
            products.forEach((p: any) => {
              logger.info(`${indent}  └─ ${p.name} (${p.slug}) [petType: ${p.petType}]`);
            });
          } else if (productCount > 5) {
            const sampleProducts = await Product.find({
              category: catId,
              deletedAt: null
            }).select('name slug petType').limit(3).lean();
            
            sampleProducts.forEach((p: any) => {
              logger.info(`${indent}  └─ ${p.name} (${p.slug}) [petType: ${p.petType}]`);
            });
            logger.info(`${indent}  └─ ... and ${productCount - 3} more`);
          }
        }
      }

      // Total products in Supplies (including all subcategories)
      const totalProducts = await Product.countDocuments({
        category: { $in: allCategoryIds },
        deletedAt: null
      });
      logger.info(`\n📊 Total products in Supplies (including all subcategories): ${totalProducts}`);

      // Check for products with petType mismatch
      logger.info('\n🔍 Checking for petType mismatches...');
      const productsWithMismatch = await Product.find({
        category: { $in: allCategoryIds },
        deletedAt: null
      })
        .select('name slug petType category')
        .populate('category', 'name petType')
        .lean();

      let mismatchCount = 0;
      productsWithMismatch.forEach((p: any) => {
        const productPetType = p.petType?.toLowerCase();
        const categoryPetType = p.category?.petType?.toLowerCase();
        
        if (productPetType && categoryPetType && productPetType !== categoryPetType) {
          mismatchCount++;
          if (mismatchCount <= 5) {
            logger.warn(`  ⚠️  Mismatch: ${p.name}`);
            logger.warn(`     Product petType: ${productPetType}`);
            logger.warn(`     Category petType: ${categoryPetType}`);
          }
        }
      });

      if (mismatchCount > 5) {
        logger.warn(`  ... and ${mismatchCount - 5} more mismatches`);
      }

      if (mismatchCount === 0) {
        logger.info('  ✅ No petType mismatches found');
      } else {
        logger.warn(`\n⚠️  Found ${mismatchCount} product(s) with petType mismatch!`);
      }
    }

    // Check for "Crates, Gates & Containment" category
    logger.info('\n' + '-'.repeat(60));
    logger.info('Checking "Crates, Gates & Containment" category...\n');
    
    const cratesCategory = await Category.findOne({
      name: { $regex: /crates.*gates.*containment/i }
    }).select('name slug petType parentCategory level').lean();

    if (cratesCategory) {
      logger.info(`✅ Found: ${cratesCategory.name}`);
      logger.info(`   Slug: ${cratesCategory.slug}`);
      logger.info(`   PetType: ${cratesCategory.petType}`);
      logger.info(`   Level: ${cratesCategory.level || 'N/A'}`);
      
      const parentId = cratesCategory.parentCategory as any;
      if (parentId) {
        const parent = await Category.findById(parentId).select('name').lean();
        logger.info(`   Parent: ${parent?.name || 'Not found'}`);
      }

      const productCount = await Product.countDocuments({
        category: cratesCategory._id,
        deletedAt: null
      });
      logger.info(`   Products: ${productCount}`);
    } else {
      logger.warn('⚠️  "Crates, Gates & Containment" category not found');
    }

    // Check for "Dog Doors & Gates" category
    logger.info('\n' + '-'.repeat(60));
    logger.info('Checking "Dog Doors & Gates" category...\n');
    
    const doorsCategory = await Category.findOne({
      name: { $regex: /dog.*doors.*gates/i }
    }).select('name slug petType parentCategory level').lean();

    if (doorsCategory) {
      logger.info(`✅ Found: ${doorsCategory.name}`);
      logger.info(`   Slug: ${doorsCategory.slug}`);
      logger.info(`   PetType: ${doorsCategory.petType}`);
      logger.info(`   Level: ${doorsCategory.level || 'N/A'}`);
      
      const parentId = doorsCategory.parentCategory as any;
      if (parentId) {
        const parent = await Category.findById(parentId).select('name').lean();
        logger.info(`   Parent: ${parent?.name || 'Not found'}`);
        
        // Check parent's parent
        if (parent && (parent as any).parentCategory) {
          const grandParent = await Category.findById((parent as any).parentCategory).select('name').lean();
          logger.info(`   Grand Parent: ${grandParent?.name || 'Not found'}`);
        }
      }

      const productCount = await Product.countDocuments({
        category: doorsCategory._id,
        deletedAt: null
      });
      logger.info(`   Products: ${productCount}`);

      if (productCount > 0) {
        const sampleProducts = await Product.find({
          category: doorsCategory._id,
          deletedAt: null
        }).select('name slug petType').limit(5).lean();
        
        logger.info('\n   Sample products:');
        sampleProducts.forEach((p: any) => {
          logger.info(`     - ${p.name} [petType: ${p.petType}]`);
        });
      }
    } else {
      logger.warn('⚠️  "Dog Doors & Gates" category not found');
    }

    await mongoose.connection.close();
    logger.info('\n✅ Diagnostic complete!\n');
  } catch (error: any) {
    logger.error('❌ Error:', error.message);
    logger.error(error.stack);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    throw error;
  }
};

if (require.main === module) {
  checkCategoryHierarchy()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n❌ Failed:', error);
      process.exit(1);
    });
}

export default checkCategoryHierarchy;

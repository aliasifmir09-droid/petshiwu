import dotenv from 'dotenv';
import { connectDatabase } from './database';
import mongoose from 'mongoose';

dotenv.config();

/**
 * Clean up redundant indexes in products collection
 * Based on analysis showing 28 indexes for 20 products
 */
const cleanupProductsIndexes = async (options: {
  dryRun?: boolean;
  removeRedundant?: boolean;
  removeDeletedAtIndexes?: boolean;
}) => {
  try {
    await connectDatabase();
    console.log('✅ Connected to database\n');

    const { dryRun, removeRedundant, removeDeletedAtIndexes } = options;

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No indexes will be dropped\n');
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    const collectionName = 'products';
    const indexes = await db.collection(collectionName).indexes();
    const stats = await db.command({ collStats: collectionName });

    console.log('📊 Products Collection Index Analysis\n');
    console.log('='.repeat(70));
    console.log(`   Current Indexes: ${indexes.length}`);
    console.log(`   Index Size: ${((stats.totalIndexSize || 0) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Data Size: ${((stats.size || 0) / 1024 / 1024).toFixed(2)} MB\n`);

    // Essential indexes that should NEVER be dropped
    const essentialIndexes = [
      '_id_',
      'slug_1', // Product lookup by slug
      'name_text_description_text_brand_text_tags_text', // Text search (if used)
    ];

    // Indexes to keep (essential for queries)
    const keepIndexes = [
      '_id_',
      'slug_1',
      'category_1', // Filter by category
      'petType_1', // Filter by pet type
      'petType_1_category_1_isActive_1', // Common compound query
      'isFeatured_1_isActive_1', // Featured products
      'variants.sku_1_sparse', // SKU lookup
    ];

    // Analyze indexes
    const redundantIndexes: string[] = [];
    const deletedAtIndexes: string[] = [];
    const singleFieldRedundant: string[] = [];
    const lowCardinalityIndexes: string[] = [];

    console.log('🔍 Analyzing indexes...\n');

    // Group indexes by pattern
    const indexPatterns = new Map<string, any[]>();
    
    indexes.forEach((index: any) => {
      const keys = Object.keys(index.key).sort().join(',');
      if (!indexPatterns.has(keys)) {
        indexPatterns.set(keys, []);
      }
      indexPatterns.get(keys)!.push(index);
    });

    // Find duplicates (same keys, different names)
    indexPatterns.forEach((indexList, keys) => {
      if (indexList.length > 1) {
        // Keep the first one, mark others as redundant
        for (let i = 1; i < indexList.length; i++) {
          if (!essentialIndexes.includes(indexList[i].name)) {
            redundantIndexes.push(indexList[i].name);
          }
        }
      }
    });

    // Analyze each index
    indexes.forEach((index: any) => {
      const indexName = index.name;
      const indexKeys = Object.keys(index.key);
      
      // Skip essential indexes
      if (essentialIndexes.includes(indexName)) {
        return;
      }

      // Check for deletedAt indexes
      if (indexKeys.includes('deletedAt') && removeDeletedAtIndexes) {
        deletedAtIndexes.push(indexName);
      }

      // Check for single-field indexes that might be covered by compound indexes
      if (indexKeys.length === 1) {
        const singleKey = indexKeys[0];
        // Check if this single field is the first field in any compound index
        const coveredByCompound = indexes.some((idx: any) => {
          const compoundKeys = Object.keys(idx.key);
          return compoundKeys.length > 1 && 
                 compoundKeys[0] === singleKey && 
                 idx.name !== indexName;
        });
        
        if (coveredByCompound && !keepIndexes.includes(indexName)) {
          singleFieldRedundant.push(indexName);
        }
      }

      // Low cardinality fields (boolean, enum)
      const lowCardinalityFields = ['isActive', 'isFeatured', 'inStock', 'deletedAt'];
      if (indexKeys.length === 1 && lowCardinalityFields.includes(indexKeys[0])) {
        if (!keepIndexes.includes(indexName)) {
          lowCardinalityIndexes.push(indexName);
        }
      }
    });

    // Display analysis
    console.log('📋 Index Analysis Results:\n');

    if (redundantIndexes.length > 0) {
      console.log(`   🔴 Duplicate Indexes (${redundantIndexes.length}):`);
      redundantIndexes.forEach(name => {
        const idx = indexes.find((i: any) => i.name === name);
        if (idx) {
          const keys = Object.keys(idx.key).map(k => `${k}:${idx.key[k]}`).join(', ');
          console.log(`      - ${name} ({${keys}})`);
        }
      });
      console.log('');
    }

    if (deletedAtIndexes.length > 0) {
      console.log(`   🟡 DeletedAt Indexes (${deletedAtIndexes.length}):`);
      deletedAtIndexes.forEach(name => {
        const idx = indexes.find((i: any) => i.name === name);
        if (idx) {
          const keys = Object.keys(idx.key).map(k => `${k}:${idx.key[k]}`).join(', ');
          console.log(`      - ${name} ({${keys}})`);
        }
      });
      console.log('');
    }

    if (singleFieldRedundant.length > 0) {
      console.log(`   🟠 Single-Field Redundant (${singleFieldRedundant.length}):`);
      singleFieldRedundant.forEach(name => {
        const idx = indexes.find((i: any) => i.name === name);
        if (idx) {
          const keys = Object.keys(idx.key).map(k => `${k}:${idx.key[k]}`).join(', ');
          console.log(`      - ${name} ({${keys}})`);
        }
      });
      console.log('');
    }

    if (lowCardinalityIndexes.length > 0) {
      console.log(`   🟢 Low Cardinality (${lowCardinalityIndexes.length}):`);
      lowCardinalityIndexes.forEach(name => {
        const idx = indexes.find((i: any) => i.name === name);
        if (idx) {
          const keys = Object.keys(idx.key).map(k => `${k}:${idx.key[k]}`).join(', ');
          console.log(`      - ${name} ({${keys}})`);
        }
      });
      console.log('');
    }

    // Indexes to keep
    console.log('   ✅ Indexes to Keep:');
    keepIndexes.forEach(name => {
      const idx = indexes.find((i: any) => i.name === name);
      if (idx) {
        const keys = Object.keys(idx.key).map(k => `${k}:${idx.key[k]}`).join(', ');
        const isUnique = idx.unique ? ' [UNIQUE]' : '';
        const isText = idx.textIndexVersion ? ' [TEXT]' : '';
        console.log(`      - ${name} ({${keys}})${isUnique}${isText}`);
      }
    });
    console.log('');

    // Calculate what would be removed
    const indexesToRemove = [
      ...redundantIndexes,
      ...(removeDeletedAtIndexes ? deletedAtIndexes : []),
      ...singleFieldRedundant,
      ...lowCardinalityIndexes,
    ].filter((name, index, self) => self.indexOf(name) === index); // Remove duplicates

    console.log('='.repeat(70));
    console.log('📊 Summary:');
    console.log('='.repeat(70));
    console.log(`   Total Indexes: ${indexes.length}`);
    console.log(`   Indexes to Keep: ${keepIndexes.length}`);
    console.log(`   Indexes to Remove: ${indexesToRemove.length}`);
    console.log(`   Estimated Reduction: ${((indexesToRemove.length / indexes.length) * 100).toFixed(1)}%`);

    if (indexesToRemove.length > 0) {
      console.log(`\n   Indexes that would be removed:`);
      indexesToRemove.forEach(name => {
        console.log(`      - ${name}`);
      });
    }

    // Remove indexes
    if (indexesToRemove.length > 0 && !dryRun) {
      console.log('\n🗑️  Removing indexes...\n');
      let removed = 0;
      let failed = 0;

      for (const indexName of indexesToRemove) {
        try {
          await db.collection(collectionName).dropIndex(indexName);
          console.log(`   ✅ Dropped: ${indexName}`);
          removed++;
        } catch (error: any) {
          console.log(`   ❌ Failed to drop: ${indexName} - ${error.message}`);
          failed++;
        }
      }

      console.log(`\n   Removed: ${removed}, Failed: ${failed}`);
      
      // Show new stats
      const newStats = await db.command({ collStats: collectionName });
      const newIndexes = await db.collection(collectionName).indexes();
      console.log(`\n   New Index Count: ${newIndexes.length}`);
      console.log(`   New Index Size: ${((newStats.totalIndexSize || 0) / 1024 / 1024).toFixed(2)} MB`);
      const reduction = ((stats.totalIndexSize || 0) - (newStats.totalIndexSize || 0)) / 1024 / 1024;
      console.log(`   Size Reduction: ${reduction.toFixed(2)} MB`);
    } else if (dryRun && indexesToRemove.length > 0) {
      console.log('\n⚠️  This was a DRY RUN - no indexes were dropped');
      console.log('   Run without --dry-run to apply changes\n');
    } else if (indexesToRemove.length === 0) {
      console.log('\n✅ No redundant indexes found to remove\n');
    }

    await mongoose.connection.close();
    console.log('✅ Analysis complete!\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// CLI interface
const args = process.argv.slice(2);
const options: any = {
  dryRun: args.includes('--dry-run') || !args.includes('--apply'),
  removeRedundant: args.includes('--remove-redundant') || args.includes('--all'),
  removeDeletedAtIndexes: args.includes('--remove-deletedat') || args.includes('--all'),
};

if (args.includes('--help') || args.length === 0) {
  console.log(`
📊 Products Collection Index Cleanup

Usage:
  ts-node src/utils/cleanupProductsIndexes.ts [options]

Options:
  --dry-run              Preview what would be removed (default)
  --apply                Actually remove indexes (requires explicit flag)
  --remove-redundant     Remove duplicate/redundant indexes
  --remove-deletedat     Remove indexes with deletedAt field
  --all                  Remove all redundant and deletedAt indexes
  --help                 Show this help

Examples:
  # Preview what would be removed (default)
  ts-node src/utils/cleanupProductsIndexes.ts

  # Actually remove redundant indexes
  ts-node src/utils/cleanupProductsIndexes.ts --all --apply

⚠️  WARNING: This will drop indexes! Always use --dry-run first!
`);
  process.exit(0);
}

cleanupProductsIndexes(options);


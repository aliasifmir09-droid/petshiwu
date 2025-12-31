import dotenv from 'dotenv';
import { connectDatabase } from '../utils/database';
import mongoose from 'mongoose';
import logger from '../utils/logger';

dotenv.config();

/**
 * Clean up unused or duplicate indexes
 */
const cleanupIndexes = async (options: {
  collection?: string;
  dryRun?: boolean;
  removeUnused?: boolean;
  removeDuplicates?: boolean;
}) => {
  try {
    await connectDatabase();
    logger.info('✅ Connected to database\n');

    const { collection, dryRun, removeUnused, removeDuplicates } = options;

    if (dryRun) {
      logger.info('🔍 DRY RUN MODE - No indexes will be dropped\n');
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    const allCollections = collection 
      ? [collection]
      : (await db.listCollections().toArray()).map(c => c.name);
    const collections = allCollections;

    logger.info('📊 Index Cleanup Analysis\n');
    logger.info('='.repeat(70));

    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      const stats = await db.command({ collStats: collName });
      
      logger.info(`\n📁 Collection: ${collName}`);
      logger.info(`   Current Indexes: ${indexes.length}`);
      logger.info(`   Index Size: ${((stats.totalIndexSize || 0) / 1024 / 1024).toFixed(2)} MB`);

      // Essential indexes that should never be dropped
      const essentialIndexes = ['_id_', 'slug_1', 'slug_1_unique'];
      
      // Find potential duplicates
      if (removeDuplicates) {
        const indexKeys = indexes.map((idx: any) => ({
          name: idx.name,
          keys: Object.keys(idx.key).sort().join(','),
          keyObj: idx.key
        }));

        const duplicates: string[] = [];
        const seen = new Set<string>();

        for (const idx of indexKeys) {
          if (idx.name === '_id_') continue; // Skip _id index
          
          if (seen.has(idx.keys)) {
            duplicates.push(idx.name);
          } else {
            seen.add(idx.keys);
          }
        }

        if (duplicates.length > 0) {
          logger.info(`\n   🔍 Found ${duplicates.length} potential duplicate index(es):`);
          for (const dupName of duplicates) {
            const idx = indexes.find((i: any) => i.name === dupName);
            if (idx) {
              const keys = Object.keys(idx.key).map(k => `${k}:${idx.key[k]}`).join(', ');
              logger.info(`      - ${dupName} ({${keys}})`);
              
              if (!dryRun && !essentialIndexes.includes(dupName)) {
                try {
                  await db.collection(collName).dropIndex(dupName);
                  logger.info(`      ✅ Dropped: ${dupName}`);
                } catch (error: any) {
                  logger.info(`      ❌ Failed to drop: ${dupName} - ${error.message}`);
                }
              } else if (dryRun) {
                logger.info(`      🔍 Would drop: ${dupName}`);
              }
            }
          }
        } else {
          logger.info(`\n   ✅ No duplicate indexes found`);
        }
      }

      // List all indexes
      logger.info(`\n   Current Indexes:`);
      indexes.forEach((index: any, idx: number) => {
        const indexName = index.name;
        const indexKeys = Object.keys(index.key).map(key => `${key}:${index.key[key]}`).join(', ');
        const isEssential = essentialIndexes.includes(indexName);
        const marker = isEssential ? '🔒' : '  ';
        
        logger.info(`     ${marker} ${idx + 1}. ${indexName} ({${indexKeys}})`);
        if (isEssential) {
          logger.info(`        ⚠️  Essential - will not be dropped`);
        }
      });
    }

    // Recommendations
    logger.info('\n' + '='.repeat(70));
    logger.info('💡 Recommendations:');
    logger.info('='.repeat(70));
    logger.info('\n   1. Review indexes in MongoDB Atlas:');
    logger.info('      - Go to Collections → products → Indexes tab');
    logger.info('      - Check which indexes are actually used');
    logger.info('      - Look for "Index Usage" statistics');
    
    logger.info('\n   2. Safe to remove (if not used):');
    logger.info('      - Indexes on fields rarely queried');
    logger.info('      - Single-field indexes covered by compound indexes');
    logger.info('      - Indexes on low-cardinality fields (boolean, enum)');
    
    logger.info('\n   3. Keep these essential indexes:');
    logger.info('      - _id (automatic)');
    logger.info('      - slug (for product lookups)');
    logger.info('      - category, petType (for filtering)');
    logger.info('      - Compound indexes for common queries');

    if (dryRun) {
      logger.info('\n⚠️  This was a DRY RUN - no indexes were dropped');
      logger.info('   Run without --dry-run to apply changes\n');
    } else {
      logger.info('\n✅ Cleanup completed!\n');
    }

    await mongoose.connection.close();
  } catch (error: any) {
    logger.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// CLI interface
const args = process.argv.slice(2);
const options: any = {
  dryRun: args.includes('--dry-run'),
  removeDuplicates: args.includes('--remove-duplicates') || args.includes('--all'),
};

const collectionIndex = args.indexOf('--collection');
if (collectionIndex !== -1 && args[collectionIndex + 1]) {
  options.collection = args[collectionIndex + 1];
}

if (args.includes('--help') || args.length === 0) {
  logger.info(`
📊 Index Cleanup Utility

Usage:
  ts-node src/utils/cleanupIndexes.ts [options]

Options:
  --collection <name>     Process specific collection only
  --remove-duplicates     Remove duplicate indexes
  --all                   Remove duplicates (same as --remove-duplicates)
  --dry-run               Show what would be done without making changes
  --help                  Show this help message

Examples:
  # Analyze all indexes
  ts-node src/utils/analyzeIndexes.ts

  # Dry run - see what would be removed
  ts-node src/utils/cleanupIndexes.ts --remove-duplicates --dry-run

  # Remove duplicate indexes
  ts-node src/utils/cleanupIndexes.ts --remove-duplicates

  # Process specific collection
  ts-node src/utils/cleanupIndexes.ts --collection products --remove-duplicates

⚠️  WARNING: Be careful when dropping indexes!
   Always use --dry-run first and verify in MongoDB Atlas.
`);
  process.exit(0);
}

cleanupIndexes(options);


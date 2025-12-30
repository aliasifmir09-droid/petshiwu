import dotenv from 'dotenv';
import { connectDatabase } from '../utils/database';
import mongoose from 'mongoose';

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
    console.log('✅ Connected to database\n');

    const { collection, dryRun, removeUnused, removeDuplicates } = options;

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No indexes will be dropped\n');
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    const allCollections = collection 
      ? [collection]
      : (await db.listCollections().toArray()).map(c => c.name);
    const collections = allCollections;

    console.log('📊 Index Cleanup Analysis\n');
    console.log('='.repeat(70));

    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      const stats = await db.command({ collStats: collName });
      
      console.log(`\n📁 Collection: ${collName}`);
      console.log(`   Current Indexes: ${indexes.length}`);
      console.log(`   Index Size: ${((stats.totalIndexSize || 0) / 1024 / 1024).toFixed(2)} MB`);

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
          console.log(`\n   🔍 Found ${duplicates.length} potential duplicate index(es):`);
          for (const dupName of duplicates) {
            const idx = indexes.find((i: any) => i.name === dupName);
            if (idx) {
              const keys = Object.keys(idx.key).map(k => `${k}:${idx.key[k]}`).join(', ');
              console.log(`      - ${dupName} ({${keys}})`);
              
              if (!dryRun && !essentialIndexes.includes(dupName)) {
                try {
                  await db.collection(collName).dropIndex(dupName);
                  console.log(`      ✅ Dropped: ${dupName}`);
                } catch (error: any) {
                  console.log(`      ❌ Failed to drop: ${dupName} - ${error.message}`);
                }
              } else if (dryRun) {
                console.log(`      🔍 Would drop: ${dupName}`);
              }
            }
          }
        } else {
          console.log(`\n   ✅ No duplicate indexes found`);
        }
      }

      // List all indexes
      console.log(`\n   Current Indexes:`);
      indexes.forEach((index: any, idx: number) => {
        const indexName = index.name;
        const indexKeys = Object.keys(index.key).map(key => `${key}:${index.key[key]}`).join(', ');
        const isEssential = essentialIndexes.includes(indexName);
        const marker = isEssential ? '🔒' : '  ';
        
        console.log(`     ${marker} ${idx + 1}. ${indexName} ({${indexKeys}})`);
        if (isEssential) {
          console.log(`        ⚠️  Essential - will not be dropped`);
        }
      });
    }

    // Recommendations
    console.log('\n' + '='.repeat(70));
    console.log('💡 Recommendations:');
    console.log('='.repeat(70));
    console.log('\n   1. Review indexes in MongoDB Atlas:');
    console.log('      - Go to Collections → products → Indexes tab');
    console.log('      - Check which indexes are actually used');
    console.log('      - Look for "Index Usage" statistics');
    
    console.log('\n   2. Safe to remove (if not used):');
    console.log('      - Indexes on fields rarely queried');
    console.log('      - Single-field indexes covered by compound indexes');
    console.log('      - Indexes on low-cardinality fields (boolean, enum)');
    
    console.log('\n   3. Keep these essential indexes:');
    console.log('      - _id (automatic)');
    console.log('      - slug (for product lookups)');
    console.log('      - category, petType (for filtering)');
    console.log('      - Compound indexes for common queries');

    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no indexes were dropped');
      console.log('   Run without --dry-run to apply changes\n');
    } else {
      console.log('\n✅ Cleanup completed!\n');
    }

    await mongoose.connection.close();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
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
  console.log(`
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


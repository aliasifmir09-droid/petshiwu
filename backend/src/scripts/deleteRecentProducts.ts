import mongoose from 'mongoose';
import Product from '../models/Product';
import { connectDatabase } from '../utils/database';
import dotenv from 'dotenv';
import * as readline from 'readline';
import logger from '../utils/logger';

dotenv.config();

/**
 * Deletes products added in the last X minutes.
 * Usage: npm run delete-recent-products [minutes] [--yes | -y]
 * Default: 5 minutes if no argument provided.
 * Example: npm run delete-recent-products 10         (prompt for confirmation)
 *          npm run delete-recent-products 5 --yes    (skip prompt, delete immediately)
 */
const DEFAULT_MINUTES = 5;

const deleteRecentProducts = async () => {
  try {
    const args = process.argv.slice(2);
    const skipConfirm = args.includes('--yes') || args.includes('-y');
    const minutesArg = args.find((a) => a !== '--yes' && a !== '-y' && !a.startsWith('-'));
    const minutes = minutesArg ? parseInt(minutesArg, 10) : DEFAULT_MINUTES;

    if (isNaN(minutes) || minutes < 1) {
      logger.warn(`Invalid minutes "${minutesArg}". Using default: ${DEFAULT_MINUTES} minutes.`);
    }

    const effectiveMinutes = isNaN(minutes) || minutes < 1 ? DEFAULT_MINUTES : minutes;
    const cutoff = new Date(Date.now() - effectiveMinutes * 60 * 1000);

    logger.info('\n' + '='.repeat(60));
    logger.info('🗑️  Delete Recently Added Products (by minutes)');
    logger.info('='.repeat(60));
    logger.info(`   Time window: last ${effectiveMinutes} minute(s)`);
    logger.info(`   Cutoff: products created before ${cutoff.toISOString()} will be KEPT.`);
    logger.info(`   Products created AFTER that will be DELETED.\n`);

    await connectDatabase();
    logger.info('✅ Connected to MongoDB\n');

    const recentProducts = await Product.find({
      createdAt: { $gte: cutoff },
    })
      .select('name sku createdAt category petType')
      .sort({ createdAt: -1 })
      .lean();

    const productCount = recentProducts.length;

    if (productCount === 0) {
      logger.info(`ℹ️  No products found that were added in the last ${effectiveMinutes} minute(s).`);
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    logger.info(`📦 Found ${productCount} product(s) added in the last ${effectiveMinutes} minute(s):\n`);
    recentProducts.forEach((p: any, idx: number) => {
      const created = p.createdAt ? new Date(p.createdAt).toISOString() : '?';
      logger.info(`   ${idx + 1}. ${p.name || '(no name)'} | SKU: ${p.sku || '—'} | ${created}`);
    });
    logger.info('');

    if (!skipConfirm) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question(`⚠️  Type "DELETE" (all caps) to delete these ${productCount} product(s): `, (input) => {
          rl.close();
          resolve((input || '').trim());
        });
      });

      if (answer !== 'DELETE') {
        logger.info('\n❌ Deletion cancelled. (You must type exactly "DELETE" in all caps.) No products were deleted.\n');
        await mongoose.connection.close();
        process.exit(0);
        return;
      }
    } else {
      logger.info(`🗑️  --yes passed: deleting ${productCount} product(s) without confirmation...\n`);
    }

    const ids = recentProducts.map((p: any) => p._id);
    const result = await Product.deleteMany({ _id: { $in: ids } });

    logger.info('\n' + '='.repeat(60));
    logger.info('📊 Deletion Summary:');
    logger.info(`   ✅ Deleted: ${result.deletedCount} product(s)`);
    logger.info('='.repeat(60) + '\n');

    await mongoose.connection.close();
    logger.info('✅ Database connection closed.\n');
  } catch (error: any) {
    logger.error('❌ Deletion failed:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    throw error;
  }
};

if (require.main === module) {
  deleteRecentProducts()
    .then(() => {
      logger.info('✅ Operation completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('\n❌ Operation failed:', err);
      process.exit(1);
    });
}

export default deleteRecentProducts;

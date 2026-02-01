/**
 * Fix categories with invalid slugs (undefined, "undefined", "null", empty)
 * Regenerates slugs from category name for SEO-friendly URLs
 * Usage: cd backend && npm run fix-category-slugs
 */
import mongoose from 'mongoose';
import Category from '../models/Category';
import { connectDatabase } from '../utils/database';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const isValidSlug = (val: unknown): boolean => {
  if (val == null || typeof val !== 'string') return false;
  const s = String(val).trim();
  if (s === '') return false;
  const lower = s.toLowerCase();
  return lower !== 'undefined' && lower !== 'null';
};

const fixCategorySlugs = async () => {
  try {
    logger.info('\n' + '='.repeat(60));
    logger.info('🔧 Fix Category Slugs (Remove undefined/null for SEO)');
    logger.info('='.repeat(60) + '\n');

    mongoose.set('bufferCommands', true);
    await connectDatabase();

    if (mongoose.connection.readyState !== 1) {
      logger.info('⏳ Waiting for MongoDB connection...');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 30000);
        const check = () => {
          if (mongoose.connection.readyState === 1) {
            clearTimeout(timeout);
            mongoose.connection.removeListener('connected', check);
            resolve();
          }
        };
        mongoose.connection.on('connected', check);
        if (mongoose.connection.readyState === 1) resolve();
      });
    }

    const categories = await Category.find({}).select('_id name slug').lean();
    let fixed = 0;

    for (const cat of categories) {
      if (!isValidSlug(cat.slug)) {
        const newSlug = (cat.name || 'category')
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '');
        if (!newSlug) continue;
        await Category.findByIdAndUpdate(cat._id, { slug: newSlug });
        logger.info(`Fixed: "${cat.name}" (id: ${cat._id}) -> slug: "${newSlug}"`);
        fixed++;
      }
    }

    logger.info(`\n✅ Done. Fixed ${fixed} categories with invalid slugs.\n`);
  } catch (error: any) {
    logger.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

fixCategorySlugs();

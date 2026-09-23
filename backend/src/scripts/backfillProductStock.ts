import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Product from '../models/Product';
import { connectDatabase } from '../utils/database';
import logger from '../utils/logger';

dotenv.config();

type StockDoc = {
  _id: unknown;
  name?: string;
  slug?: string;
  inStock?: boolean;
  totalStock?: number;
  variants?: Array<{ sku?: string; stock?: number }>;
};

export function plannedStock(product: StockDoc): { totalStock: number; inStock: boolean } {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const totalStock =
    variants.length > 0
      ? variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0)
      : Number(product.totalStock) || 0;
  return { totalStock, inStock: totalStock > 0 };
}

export function needsStockBackfill(product: StockDoc): boolean {
  const next = plannedStock(product);
  return product.totalStock !== next.totalStock || product.inStock !== next.inStock;
}

const backfillProductStock = async () => {
  const outDir = process.env.STOCK_BACKUP_DIR || path.join('/tmp', 'petshiwu-stock-backfill');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(outDir, `product-stock-backup-${stamp}.json`);

  await connectDatabase();
  const products = await Product.find({ deletedAt: null })
    .select('name slug inStock totalStock variants.sku variants.stock')
    .lean()
    .exec();

  const dirty = (products as StockDoc[]).filter(needsStockBackfill);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        totalProducts: products.length,
        toFix: dirty.length,
        products: dirty,
      },
      null,
      2
    )
  );
  logger.info(`Backup written: ${backupPath} (${dirty.length} of ${products.length} need a fix)`);

  if (process.env.STOCK_BACKFILL_WRITE !== '1') {
    logger.info('Dry run only. Set STOCK_BACKFILL_WRITE=1 to apply.');
    process.exit(0);
  }

  let fixed = 0;
  for (const product of dirty) {
    const next = plannedStock(product);
    await Product.updateOne(
      { _id: product._id },
      { $set: { totalStock: next.totalStock, inStock: next.inStock } }
    );
    fixed += 1;
    logger.info(`Fixed ${product.slug || product.name}: ${next.totalStock} / ${next.inStock}`);
  }
  logger.info(`Backfill applied: ${fixed}`);
  process.exit(0);
};

if (require.main === module) {
  backfillProductStock().catch((err) => {
    logger.error(err);
    process.exit(1);
  });
}

export default backfillProductStock;

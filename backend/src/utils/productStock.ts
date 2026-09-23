import fs from 'fs';
import path from 'path';
import Product from '../models/Product';
import logger from './logger';

export type StockDoc = {
  _id?: unknown;
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
  return Number(product.totalStock || 0) !== next.totalStock || Boolean(product.inStock) !== next.inStock;
}

export function firstInStockVariantSku(product: StockDoc, quantity = 1): string | undefined {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const match = variants.find((variant) => (Number(variant.stock) || 0) >= quantity && variant.sku);
  return match?.sku;
}

export async function applyProductStockSync(opts?: {
  write?: boolean;
  backupDir?: string;
}): Promise<{ scanned: number; toFix: number; fixed: number; backupPath: string }> {
  const write = opts?.write !== false;
  const outDir = opts?.backupDir || process.env.STOCK_BACKUP_DIR || path.join('/tmp', 'petshiwu-stock-backfill');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(outDir, `product-stock-backup-${stamp}.json`);

  const products = (await Product.find({ deletedAt: null })
    .select('name slug inStock totalStock variants.sku variants.stock')
    .lean()
    .exec()) as StockDoc[];

  const dirty = products.filter(needsStockBackfill);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        totalProducts: products.length,
        toFix: dirty.length,
        products: dirty.map((product) => ({
          _id: product._id,
          totalStock: product.totalStock,
          inStock: product.inStock,
          variants: product.variants,
        })),
      },
      null,
      2
    )
  );

  let fixed = 0;
  if (write) {
    for (const product of dirty) {
      const next = plannedStock(product);
      await Product.updateOne(
        { _id: product._id },
        { $set: { totalStock: next.totalStock, inStock: next.inStock } }
      );
      fixed += 1;
    }
  }

  logger.info(
    `Product stock sync: scanned=${products.length} toFix=${dirty.length} fixed=${fixed} backup=${backupPath}`
  );
  return { scanned: products.length, toFix: dirty.length, fixed, backupPath };
}

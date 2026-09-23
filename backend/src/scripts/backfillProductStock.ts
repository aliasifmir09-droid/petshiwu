import dotenv from 'dotenv';
import { applyProductStockSync } from '../utils/productStock';
import { connectDatabase } from '../utils/database';
import logger from '../utils/logger';

dotenv.config();

export { needsStockBackfill, plannedStock } from '../utils/productStock';

const backfillProductStock = async () => {
  await connectDatabase();
  const result = await applyProductStockSync({
    write: process.env.STOCK_BACKFILL_WRITE === '1',
  });
  if (process.env.STOCK_BACKFILL_WRITE !== '1') {
    logger.info('Dry run only. Set STOCK_BACKFILL_WRITE=1 to apply.');
  }
  logger.info(result);
  process.exit(0);
};

if (require.main === module) {
  backfillProductStock().catch((err) => {
    logger.error(err);
    process.exit(1);
  });
}

export default backfillProductStock;

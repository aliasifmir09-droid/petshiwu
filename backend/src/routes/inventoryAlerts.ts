import express from 'express';
import {
  getLowStockProducts,
  updateProductThreshold,
  bulkUpdateThresholds
} from '../controllers/inventoryAlertController';
import { protect } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { validateObjectId } from '../middleware/validation';

const router = express.Router();

// Inventory alert routes (admin or staff with permission)
router.get('/low-stock', protect, checkPermission('canManageProducts'), getLowStockProducts);
router.put('/product/:id/threshold', protect, checkPermission('canManageProducts'), validateObjectId(), updateProductThreshold);
router.post('/bulk-update-thresholds', protect, checkPermission('canManageProducts'), bulkUpdateThresholds);

export default router;


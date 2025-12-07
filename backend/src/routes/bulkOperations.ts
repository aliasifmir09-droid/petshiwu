import express from 'express';
import {
  bulkUpdateProducts,
  bulkAssignCategory
} from '../controllers/bulkOperationsController';
import { protect } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// Bulk operations (admin or staff with permission)
router.post('/products/update', protect, checkPermission('canManageProducts'), bulkUpdateProducts);
router.post('/products/assign-category', protect, checkPermission('canManageProducts'), bulkAssignCategory);

export default router;


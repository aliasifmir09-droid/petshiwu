import express from 'express';
import {
  exportOrders,
  exportProducts,
  exportCustomers
} from '../controllers/exportController';
import { protect } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// Export routes (admin or staff with permission)
router.get('/orders', protect, checkPermission('canManageOrders'), exportOrders);
router.get('/products', protect, checkPermission('canManageProducts'), exportProducts);
router.get('/customers', protect, checkPermission('canManageCustomers'), exportCustomers);

export default router;


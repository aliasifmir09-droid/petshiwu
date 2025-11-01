import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
  cancelOrder,
  trackOrder
} from '../controllers/orderController';
import { protect, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import {
  createOrderValidation,
  validateObjectId,
  paginationValidation
} from '../middleware/validation';

const router = express.Router();

// Public route for order tracking (no authentication required)
router.get('/track/:id', validateObjectId(), trackOrder);

router.post('/', protect, createOrderValidation, createOrder);
router.get('/myorders', protect, paginationValidation, getMyOrders);
router.get('/stats', protect, checkPermission('canViewAnalytics'), getOrderStats);
router.get('/all', protect, checkPermission('canManageOrders'), paginationValidation, getAllOrders);
router.get('/:id', protect, validateObjectId(), getOrder);
router.put('/:id/cancel', protect, validateObjectId(), cancelOrder);
router.put('/:id/status', protect, checkPermission('canManageOrders'), validateObjectId(), updateOrderStatus);
router.put('/:id/payment', protect, checkPermission('canManageOrders'), validateObjectId(), updatePaymentStatus);

export default router;




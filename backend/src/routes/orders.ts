import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  processRefund,
  getOrderStats,
  cancelOrder,
  trackOrder,
  createOrderPaymentIntent,
  confirmOrderPayment
} from '../controllers/orderController';
import {
  createReturn,
  getMyReturns,
  getReturn,
  updateReturnStatus,
  getAllReturns
} from '../controllers/returnController';
import { protect, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import {
  createOrderValidation,
  validateObjectId,
  paginationValidation,
  adminPaginationValidation,
  createReturnValidation,
  createPaymentIntentValidation,
  confirmPaymentValidation
} from '../middleware/validation';

const router = express.Router();

// Public route for order tracking (no authentication required)
router.get('/track/:id', trackOrder);

// GUEST CHECKOUT: These routes no longer require auth middleware
// The controller handles both guests and logged-in users
router.post('/payment-intent', createPaymentIntentValidation, createOrderPaymentIntent);
router.post('/confirm-payment', confirmPaymentValidation, confirmOrderPayment);
router.post('/', createOrderValidation, createOrder);

// Authenticated routes
router.get('/myorders', protect, paginationValidation, getMyOrders);
router.get('/stats', protect, checkPermission('canViewAnalytics'), getOrderStats);
router.get('/all', protect, checkPermission('canManageOrders'), adminPaginationValidation, getAllOrders);
router.get('/:id', protect, validateObjectId(), getOrder);
router.put('/:id/cancel', protect, validateObjectId(), cancelOrder);
router.put('/:id/status', protect, checkPermission('canManageOrders'), validateObjectId(), updateOrderStatus);
router.put('/:id/payment', protect, checkPermission('canManageOrders'), validateObjectId(), updatePaymentStatus);
router.post('/:id/refund', protect, checkPermission('canManageOrders'), validateObjectId(), processRefund);

// Return/Refund routes
router.post('/returns', protect, createReturnValidation, createReturn);
router.get('/returns/my', protect, paginationValidation, getMyReturns);
router.get('/returns/all', protect, checkPermission('canManageOrders'), adminPaginationValidation, getAllReturns);
router.get('/returns/:id', protect, validateObjectId(), getReturn);
router.put('/returns/:id/status', protect, checkPermission('canManageOrders'), validateObjectId(), updateReturnStatus);

export default router;

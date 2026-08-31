import express from 'express';
import {
  createOrder,
  createPayPalCheckoutOrder,
  capturePayPalCheckoutOrder,
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
  getBuyAgain,
  createReorderReminder,
  cancelReorderReminder
} from '../controllers/buyAgainController';
import {
  createReturn,
  getMyReturns,
  getReturn,
  updateReturnStatus,
  getAllReturns
} from '../controllers/returnController';
import { protect, optionalAuth } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import {
  createOrderValidation,
  validateObjectId,
  validateOrderIdentifier,
  paginationValidation,
  adminPaginationValidation,
  createReturnValidation,
  createPaymentIntentValidation,
  createPayPalOrderValidation,
  capturePayPalOrderValidation,
  confirmPaymentValidation
} from '../middleware/validation';

const router = express.Router();

// Emergency checkout stop: rejects every new order before PayPal or another
// payment path can create or capture a charge. Existing-order operations stay available.
const orderAcceptancePaused = (_req: express.Request, res: express.Response): void => {
  res.status(503).json({
    success: false,
    code: 'ORDERING_TEMPORARILY_PAUSED',
    message: 'Ordering is temporarily unavailable. Please check back shortly.'
  });
};

// Public route for order tracking (no authentication required)
router.get('/track/:id', trackOrder);

// GUEST CHECKOUT: These routes no longer require auth middleware
// The controller handles both guests and logged-in users
// Guest checkout: optionalAuth so a logged-in shopper's card and address can be saved.
router.post('/payment-intent', orderAcceptancePaused);
router.post('/paypal/create-order', orderAcceptancePaused);
router.post('/paypal/capture-order', orderAcceptancePaused);
router.post('/confirm-payment', orderAcceptancePaused);
router.post('/', orderAcceptancePaused);

// Authenticated routes
router.get('/myorders', protect, paginationValidation, getMyOrders);
router.get('/buy-again', protect, getBuyAgain);
router.get('/stats', protect, checkPermission('canViewAnalytics'), getOrderStats);
router.get('/all', protect, checkPermission('canManageOrders'), adminPaginationValidation, getAllOrders);
router.post('/:id/reminder', protect, validateOrderIdentifier(), createReorderReminder);
router.delete('/reminders/:id', protect, cancelReorderReminder);
router.get('/:id', protect, validateOrderIdentifier(), getOrder);
router.put('/:id/cancel', protect, validateOrderIdentifier(), cancelOrder);
router.put('/:id/status', protect, checkPermission('canManageOrders'), validateOrderIdentifier(), updateOrderStatus);
router.put('/:id/payment', protect, checkPermission('canManageOrders'), validateOrderIdentifier(), updatePaymentStatus);
router.post('/:id/refund', protect, checkPermission('canManageOrders'), validateOrderIdentifier(), processRefund);

// Return/Refund routes
router.post('/returns', protect, createReturnValidation, createReturn);
router.get('/returns/my', protect, paginationValidation, getMyReturns);
router.get('/returns/all', protect, checkPermission('canManageOrders'), adminPaginationValidation, getAllReturns);
router.get('/returns/:id', protect, validateObjectId(), getReturn);
router.put('/returns/:id/status', protect, checkPermission('canManageOrders'), validateObjectId(), updateReturnStatus);

export default router;

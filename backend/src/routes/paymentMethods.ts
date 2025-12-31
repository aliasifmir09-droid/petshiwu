import express from 'express';
import {
  getPaymentMethods,
  savePaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getDefaultPaymentMethod
} from '../controllers/paymentMethodController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validateRequest';
import { body, param } from 'express-validator';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/payment-methods
 * @desc    Get all saved payment methods for current user
 * @access  Private
 */
router.get('/', getPaymentMethods);

/**
 * @route   GET /api/payment-methods/default
 * @desc    Get default payment method for current user
 * @access  Private
 */
router.get('/default', getDefaultPaymentMethod);

/**
 * @route   POST /api/payment-methods
 * @desc    Save a new payment method
 * @access  Private
 */
router.post(
  '/',
  [
    body('type').isIn(['credit_card', 'paypal', 'apple_pay', 'google_pay']).withMessage('Invalid payment method type'),
    body('stripePaymentMethodId').optional().isString(),
    body('paypalAccountId').optional().isString(),
    body('last4').optional().isString().isLength({ min: 4, max: 4 }),
    body('brand').optional().isString(),
    body('expiryMonth').optional().isInt({ min: 1, max: 12 }),
    body('expiryYear').optional().isInt({ min: new Date().getFullYear() }),
    body('isDefault').optional().isBoolean(),
    body('billingAddress').optional().isObject()
  ],
  validate,
  savePaymentMethod
);

/**
 * @route   PUT /api/payment-methods/:id
 * @desc    Update a payment method
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid payment method ID'),
    body('isDefault').optional().isBoolean(),
    body('billingAddress').optional().isObject()
  ],
  validate,
  updatePaymentMethod
);

/**
 * @route   DELETE /api/payment-methods/:id
 * @desc    Delete a payment method
 * @access  Private
 */
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid payment method ID')],
  validate,
  deletePaymentMethod
);

export default router;


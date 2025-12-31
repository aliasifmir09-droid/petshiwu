import express from 'express';
import {
  getReorderSuggestions,
  getProductReorderSuggestion,
} from '../controllers/reorderSuggestionsController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validateRequest';
import { query, param } from 'express-validator';

const router = express.Router();

// All routes require admin access
router.use(protect);
router.use(authorize('admin'));

/**
 * @route GET /api/reorder-suggestions
 * @desc Get reorder suggestions for all products (admin only)
 * @access Private (admin only)
 */
router.get(
  '/',
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
    query('leadTimeDays').optional().isInt({ min: 1, max: 90 }).withMessage('Lead time must be between 1 and 90 days'),
    query('safetyStockDays').optional().isInt({ min: 0, max: 30 }).withMessage('Safety stock must be between 0 and 30 days'),
    query('minSalesForSuggestion').optional().isInt({ min: 0 }).withMessage('Minimum sales must be a non-negative integer'),
    query('includeInStock').optional().isBoolean().withMessage('includeInStock must be a boolean'),
  ],
  validate,
  getReorderSuggestions
);

/**
 * @route GET /api/reorder-suggestions/:productId
 * @desc Get reorder suggestion for a specific product (admin only)
 * @access Private (admin only)
 */
router.get(
  '/:productId',
  [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
    query('leadTimeDays').optional().isInt({ min: 1, max: 90 }).withMessage('Lead time must be between 1 and 90 days'),
    query('safetyStockDays').optional().isInt({ min: 0, max: 30 }).withMessage('Safety stock must be between 0 and 30 days'),
  ],
  validate,
  getProductReorderSuggestion
);

export default router;


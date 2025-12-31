import express from 'express';
import {
  trackRecommendationClick,
  getRecommendationAnalytics,
} from '../controllers/recommendationAnalyticsController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validateRequest';
import { body, query } from 'express-validator';

const router = express.Router();

/**
 * @route POST /api/recommendations/track
 * @desc Track recommendation click
 * @access Public (works with or without authentication)
 */
router.post(
  '/track',
  [
    body('productId').isMongoId().withMessage('Valid product ID is required'),
    body('recommendationType')
      .isIn(['frequently-bought-together', 'customers-also-bought', 'you-may-also-like', 'similar-products', 'trending', 'personalized'])
      .withMessage('Valid recommendation type is required'),
    body('sourceProductId').optional().isMongoId().withMessage('Valid source product ID is required'),
    body('position').optional().isInt({ min: 0 }).withMessage('Position must be a non-negative integer'),
  ],
  validate,
  trackRecommendationClick
);

/**
 * @route GET /api/recommendations/analytics
 * @desc Get recommendation analytics (admin only)
 * @access Private (admin only)
 */
router.get(
  '/analytics',
  protect,
  authorize('admin'),
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
    query('recommendationType')
      .optional()
      .isIn(['frequently-bought-together', 'customers-also-bought', 'you-may-also-like', 'similar-products', 'trending', 'personalized'])
      .withMessage('Valid recommendation type is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  getRecommendationAnalytics
);

export default router;


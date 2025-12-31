import express from 'express';
import { getSearchAnalytics, getSearchSuggestions } from '../controllers/searchAnalyticsController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/permissions';
import { validateRequest } from '../middleware/validateRequest';
import { query } from 'express-validator';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('admin'));

/**
 * @route   GET /api/search/analytics
 * @desc    Get search analytics (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  getSearchAnalytics
);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions based on analytics
 * @access  Private (Admin)
 */
router.get(
  '/suggestions',
  [
    query('q').trim().notEmpty().withMessage('Search query is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  ],
  validateRequest,
  getSearchSuggestions
);

export default router;


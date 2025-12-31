import express from 'express';
import {
  saveSearchHistory,
  getSearchHistory,
  deleteSearchHistory,
  clearSearchHistory,
  trackSearchClick,
} from '../controllers/searchHistoryController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { body, param, query } from 'express-validator';

const router = express.Router();

/**
 * @route   POST /api/search/history
 * @desc    Save search history
 * @access  Public (works with or without authentication)
 */
router.post(
  '/',
  [
    body('query').trim().notEmpty().withMessage('Search query is required'),
    body('filters').optional().isObject(),
    body('resultsCount').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  saveSearchHistory
);

/**
 * @route   GET /api/search/history
 * @desc    Get search history for current user/session
 * @access  Public (works with or without authentication)
 */
router.get(
  '/',
  [query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')],
  validateRequest,
  getSearchHistory
);

/**
 * @route   DELETE /api/search/history
 * @desc    Clear all search history for current user/session
 * @access  Public (works with or without authentication)
 */
router.delete('/', clearSearchHistory);

/**
 * @route   DELETE /api/search/history/:id
 * @desc    Delete specific search history entry
 * @access  Public (works with or without authentication)
 */
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid search history ID')],
  validateRequest,
  deleteSearchHistory
);

/**
 * @route   POST /api/search/history/:id/click
 * @desc    Track search result click
 * @access  Public (works with or without authentication)
 */
router.post(
  '/:id/click',
  [
    param('id').isMongoId().withMessage('Invalid search history ID'),
    body('productId').isMongoId().withMessage('Product ID is required'),
    body('position').optional().isInt({ min: 0 }).withMessage('Position must be a non-negative integer'),
  ],
  validateRequest,
  trackSearchClick
);

export default router;


import express from 'express';
import {
  getPublishedFAQs,
  getFAQById,
  getFAQCategories,
  markFAQHelpful,
  markFAQNotHelpful,
  getAllFAQsAdmin,
  createFAQ,
  updateFAQ,
  deleteFAQ
} from '../controllers/faqController';
import { protect, authorize } from '../middleware/auth';
import { validateObjectId } from '../middleware/validation';
import { cacheMiddleware } from '../utils/cache';
import { asyncHandler } from '../utils/errors';

const router = express.Router();

// Public routes (cached)
router.get('/', cacheMiddleware(3600), asyncHandler(getPublishedFAQs)); // Cache for 1 hour
router.get('/categories', cacheMiddleware(3600), asyncHandler(getFAQCategories)); // Cache for 1 hour
router.get('/:id', validateObjectId(), asyncHandler(getFAQById));
router.post('/:id/helpful', validateObjectId(), asyncHandler(markFAQHelpful));
router.post('/:id/not-helpful', validateObjectId(), asyncHandler(markFAQNotHelpful));

// Admin routes (require authentication and admin role)
router.get('/admin/all', protect, authorize('admin'), asyncHandler(getAllFAQsAdmin));
router.get('/admin/:id', protect, authorize('admin'), validateObjectId(), asyncHandler(getFAQById));
router.post('/admin', protect, authorize('admin'), asyncHandler(createFAQ));
router.put('/admin/:id', protect, authorize('admin'), validateObjectId(), asyncHandler(updateFAQ));
router.delete('/admin/:id', protect, authorize('admin'), validateObjectId(), asyncHandler(deleteFAQ));

export default router;


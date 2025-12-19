import express from 'express';
import {
  getPublishedCareGuides,
  getCareGuideBySlug,
  getCareGuideCategories,
  getAllCareGuidesAdmin,
  getCareGuideById,
  createCareGuide,
  updateCareGuide,
  deleteCareGuide
} from '../controllers/careGuideController';
import { protect, authorize } from '../middleware/auth';
import { validateObjectId } from '../middleware/validation';
import { cacheMiddleware } from '../utils/cache';
import { asyncHandler } from '../utils/errors';

const router = express.Router();

// Public routes (cached)
router.get('/', cacheMiddleware(300), asyncHandler(getPublishedCareGuides)); // Cache for 5 minutes
router.get('/categories', cacheMiddleware(3600), asyncHandler(getCareGuideCategories)); // Cache for 1 hour
router.get('/:slug', cacheMiddleware(300), asyncHandler(getCareGuideBySlug)); // Cache for 5 minutes

// Admin routes (require authentication and admin role)
router.get('/admin/all', protect, authorize('admin'), asyncHandler(getAllCareGuidesAdmin)); // Get all care guides (published/unpublished)
router.get('/admin/:id', protect, authorize('admin'), validateObjectId(), asyncHandler(getCareGuideById)); // Get single care guide by ID
router.post('/admin', protect, authorize('admin'), asyncHandler(createCareGuide));
router.put('/admin/:id', protect, authorize('admin'), validateObjectId(), asyncHandler(updateCareGuide));
router.delete('/admin/:id', protect, authorize('admin'), validateObjectId(), asyncHandler(deleteCareGuide));

export default router;


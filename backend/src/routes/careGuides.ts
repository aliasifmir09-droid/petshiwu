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
import { checkPermission } from '../middleware/permissions';
import { validateObjectId } from '../middleware/validation';
import { cacheMiddleware } from '../utils/cache';
import { asyncHandler } from '../utils/errors';

const router = express.Router();

// Public routes (cached)
router.get('/', cacheMiddleware(300), asyncHandler(getPublishedCareGuides)); // Cache for 5 minutes
router.get('/categories', cacheMiddleware(3600), asyncHandler(getCareGuideCategories)); // Cache for 1 hour
router.get('/:slug', cacheMiddleware(300), asyncHandler(getCareGuideBySlug)); // Cache for 5 minutes

// Admin routes (protected)
router.use('/admin', protect, authorize(['admin', 'staff']));

// Care Guide Management (Admin)
router.get('/admin/all', asyncHandler(getAllCareGuidesAdmin)); // Get all care guides (published/unpublished)
router.get('/admin/:id', validateObjectId, asyncHandler(getCareGuideById)); // Get single care guide by ID
router.post('/admin', checkPermission('createAny', 'CareGuide'), asyncHandler(createCareGuide));
router.put('/admin/:id', checkPermission('updateAny', 'CareGuide'), validateObjectId, asyncHandler(updateCareGuide));
router.delete('/admin/:id', checkPermission('deleteAny', 'CareGuide'), validateObjectId, asyncHandler(deleteCareGuide));

export default router;


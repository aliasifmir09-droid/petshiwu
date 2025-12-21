import express from 'express';
import {
  getActiveSlides,
  getAllSlides,
  getSlideById,
  createSlide,
  updateSlide,
  deleteSlide,
  reorderSlides,
  seedSlideshow
} from '../controllers/slideshowController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public route - get active slides for frontend
router.get('/active', getActiveSlides);

// Admin routes - require authentication and admin role
router.get('/', protect, authorize('admin'), getAllSlides);
router.get('/:id', protect, authorize('admin'), getSlideById);
router.post('/', protect, authorize('admin'), createSlide);
router.put('/:id', protect, authorize('admin'), updateSlide);
router.delete('/:id', protect, authorize('admin'), deleteSlide);
router.post('/reorder', protect, authorize('admin'), reorderSlides);
router.post('/seed', protect, authorize('admin'), seedSlideshow);

export default router;


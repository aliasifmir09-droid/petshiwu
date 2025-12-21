import express from 'express';
import {
  getActiveSlides,
  getAllSlides,
  getSlideById,
  createSlide,
  updateSlide,
  deleteSlide,
  reorderSlides
} from '../controllers/slideshowController';
import { protect, admin } from '../middleware/auth';

const router = express.Router();

// Public route - get active slides for frontend
router.get('/active', getActiveSlides);

// Admin routes - require authentication and admin role
router.get('/', protect, admin, getAllSlides);
router.get('/:id', protect, admin, getSlideById);
router.post('/', protect, admin, createSlide);
router.put('/:id', protect, admin, updateSlide);
router.delete('/:id', protect, admin, deleteSlide);
router.post('/reorder', protect, admin, reorderSlides);

export default router;


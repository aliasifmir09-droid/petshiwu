import express from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview
} from '../controllers/reviewController';
import { protect } from '../middleware/auth';
import {
  createReviewValidation,
  validateObjectId,
  paginationValidation
} from '../middleware/validation';

const router = express.Router();

router.get('/product/:productId', validateObjectId('productId'), paginationValidation, getProductReviews);
router.post('/', protect, createReviewValidation, createReview);
router.put('/:id', protect, validateObjectId(), updateReview);
router.delete('/:id', protect, validateObjectId(), deleteReview);

export default router;




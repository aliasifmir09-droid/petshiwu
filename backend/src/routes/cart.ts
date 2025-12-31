import express from 'express';
import {
  saveCart,
  getCart,
  getSharedCart,
  clearCart,
  getDeliveryEstimate
} from '../controllers/cartController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes are optional auth (work for both authenticated and guest users)
router.post('/', protect, saveCart); // Optional auth
router.get('/', protect, getCart); // Optional auth
router.get('/share/:shareId', getSharedCart); // Public
router.delete('/', protect, clearCart); // Optional auth
router.get('/delivery-estimate', getDeliveryEstimate); // Public

export default router;


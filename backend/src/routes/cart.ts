import express from 'express';
import {
  saveCart,
  getCart,
  getSharedCart,
  clearCart,
  getDeliveryEstimate
} from '../controllers/cartController';
import { protect, optionalAuth } from '../middleware/auth';

const router = express.Router();

// All routes are optional auth (work for both authenticated and guest users)
router.post('/', optionalAuth, saveCart); // Optional auth
router.get('/', optionalAuth, getCart); // Optional auth
router.get('/share/:shareId', getSharedCart); // Public
router.delete('/', optionalAuth, clearCart); // Optional auth
router.get('/delivery-estimate', getDeliveryEstimate); // Public

export default router;


import express from 'express';
import {
  createDonationIntent,
  confirmDonation,
  getDonation,
  getAllDonations,
  getDonationStats,
  stripeWebhook
} from '../controllers/donationController';
import { protect, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { 
  validateObjectId, 
  paginationValidation, 
  adminPaginationValidation,
  createDonationIntentValidation,
  confirmDonationValidation
} from '../middleware/validation';

const router = express.Router();

// Stripe webhook (must be before body parser middleware)
// In your server.ts, make sure to exclude this route from body parsing
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Public route - anyone can create a donation
router.post('/create-intent', createDonationIntentValidation, createDonationIntent);

// Confirm donation (public, but should be called after payment)
router.post('/confirm', confirmDonationValidation, confirmDonation);

// Get single donation (user can see their own, admin can see all)
router.get('/:id', protect, validateObjectId(), getDonation);

// Admin routes
router.get('/admin/all', protect, checkPermission('canViewAnalytics'), adminPaginationValidation, getAllDonations);
router.get('/admin/stats', protect, checkPermission('canViewAnalytics'), getDonationStats);

export default router;


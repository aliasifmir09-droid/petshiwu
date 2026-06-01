import { Router } from 'express';
import { googleMerchantFeed } from '../controllers/merchantFeedController';

const router = Router();

// Google Merchant Center product feed
// GET /api/v1/feed/google
router.get('/google', googleMerchantFeed);

export default router;

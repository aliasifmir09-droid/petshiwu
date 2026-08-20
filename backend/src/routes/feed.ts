import { Router } from 'express';
import { googleMerchantFeed } from '../controllers/merchantFeedController';

const router = Router();

// Google Merchant Center product feed (free listings / Popular products)
router.get('/google', googleMerchantFeed);
router.get('/google.xml', googleMerchantFeed);

export default router;

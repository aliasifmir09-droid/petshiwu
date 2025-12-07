import express from 'express';
import { getAdvancedAnalytics } from '../controllers/analyticsController';
import { protect } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// Advanced analytics (admin only)
router.get('/advanced', protect, checkPermission('canViewAnalytics'), getAdvancedAnalytics);

export default router;


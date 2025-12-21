import express from 'express';
import {
  reindexAllProducts,
  getElasticsearchStatus,
  resetIndex
} from '../controllers/elasticsearchController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public route - check Elasticsearch status
router.get('/status', getElasticsearchStatus);

// Admin routes - require authentication and admin role
router.post('/reindex', protect, authorize('admin'), reindexAllProducts);
router.post('/reset-index', protect, authorize('admin'), resetIndex);

export default router;


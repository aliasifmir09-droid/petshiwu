import express from 'express';
import {
  getProducts,
  getProduct,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getProductStats
} from '../controllers/productController';
import { protect, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import {
  createProductValidation,
  validateObjectId,
  paginationValidation
} from '../middleware/validation';

const router = express.Router();

router.get('/', paginationValidation, getProducts);
router.get('/stats', protect, checkPermission('canViewAnalytics'), getProductStats);
router.get('/:id/related', getRelatedProducts);
router.get('/:id', getProduct);
router.post('/', protect, checkPermission('canManageProducts'), createProductValidation, createProduct);
router.put('/:id', protect, checkPermission('canManageProducts'), validateObjectId(), updateProduct);
router.delete('/:id', protect, checkPermission('canManageProducts'), validateObjectId(), deleteProduct);
router.post('/:id/restore', protect, checkPermission('canManageProducts'), validateObjectId(), restoreProduct);

export default router;




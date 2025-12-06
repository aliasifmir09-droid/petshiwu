import express from 'express';
import {
  getProducts,
  getProduct,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getProductStats,
  getUniqueBrands,
  importProductsFromCSV
} from '../controllers/productController';
import { getProductRecommendations, getFrequentlyBoughtTogether } from '../controllers/recommendationController';
import { compareProducts, getComparisonSuggestions } from '../controllers/comparisonController';
import { protect, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import {
  createProductValidation,
  validateObjectId,
  paginationValidation
} from '../middleware/validation';
import { csvUpload } from '../middleware/csvUpload';

const router = express.Router();

router.get('/', paginationValidation, getProducts);
router.get('/brands', getUniqueBrands); // Public endpoint for unique brands
router.get('/stats', protect, checkPermission('canViewAnalytics'), getProductStats);
router.get('/compare', compareProducts); // GET /api/products/compare?productIds=id1,id2,id3
router.get('/compare/suggestions', getComparisonSuggestions); // GET /api/products/compare/suggestions?productIds=id1,id2
router.get('/:id/recommendations', getProductRecommendations); // Intelligent recommendations
router.get('/:id/frequently-bought-together', getFrequentlyBoughtTogether); // Frequently bought together
router.get('/:id/related', getRelatedProducts); // Basic related products (backward compatible)
router.get('/:id', getProduct);
router.post('/', protect, checkPermission('canManageProducts'), createProductValidation, createProduct);
router.post('/import', protect, checkPermission('canManageProducts'), csvUpload.single('csv'), importProductsFromCSV);
router.put('/:id', protect, checkPermission('canManageProducts'), validateObjectId(), updateProduct);
router.delete('/:id', protect, checkPermission('canManageProducts'), validateObjectId(), deleteProduct);
router.post('/:id/restore', protect, checkPermission('canManageProducts'), validateObjectId(), restoreProduct);

export default router;




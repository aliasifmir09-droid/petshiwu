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
import { advancedSearch, searchAutocomplete } from '../controllers/searchController';
import { getProductShareLinks } from '../controllers/socialController';
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
router.get('/search', advancedSearch); // Advanced search with filters
router.get('/search/autocomplete', searchAutocomplete); // Search autocomplete
router.get('/brands', getUniqueBrands); // Public endpoint for unique brands
router.get('/stats', protect, checkPermission('canViewAnalytics'), getProductStats);
router.get('/compare', compareProducts); // GET /api/products/compare?productIds=id1,id2,id3
router.get('/compare/suggestions', getComparisonSuggestions); // GET /api/products/compare/suggestions?productIds=id1,id2
router.get('/:id/share', getProductShareLinks); // Social sharing links
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




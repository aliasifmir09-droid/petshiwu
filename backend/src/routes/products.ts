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
  validateProductIdentifier,
  paginationValidation,
  searchValidation,
  productIdsValidation,
  productIdsValidationForSuggestions
} from '../middleware/validation';
import { csvUpload } from '../middleware/csvUpload';

const router = express.Router();

router.get('/', paginationValidation, getProducts);
router.get('/search', searchValidation, advancedSearch); // Advanced search with filters
router.get('/search/autocomplete', searchValidation, searchAutocomplete); // Search autocomplete
router.get('/brands', getUniqueBrands); // Public endpoint for unique brands
router.get('/stats', protect, checkPermission('canViewAnalytics'), getProductStats);
router.get('/compare', productIdsValidation, compareProducts); // GET /api/products/compare?productIds=id1,id2,id3 (requires 2+ IDs)
router.get('/compare/suggestions', productIdsValidationForSuggestions, getComparisonSuggestions); // GET /api/products/compare/suggestions?productIds=id1 (allows 1+ IDs)
router.get('/:id/share', validateProductIdentifier(), getProductShareLinks); // Social sharing links - supports slug or ID
router.get('/:id/recommendations', validateProductIdentifier(), getProductRecommendations); // Intelligent recommendations - supports slug or ID
router.get('/:id/frequently-bought-together', validateProductIdentifier(), getFrequentlyBoughtTogether); // Frequently bought together - supports slug or ID
router.get('/:id/related', validateProductIdentifier(), getRelatedProducts); // Basic related products - supports slug or ID
router.get('/:id', validateProductIdentifier(), getProduct); // Get product by slug or ID
router.post('/', protect, checkPermission('canManageProducts'), createProductValidation, createProduct);
router.post('/import', protect, checkPermission('canManageProducts'), csvUpload.single('csv'), importProductsFromCSV);
router.put('/:id', protect, checkPermission('canManageProducts'), validateObjectId(), updateProduct);
router.delete('/:id', protect, checkPermission('canManageProducts'), validateObjectId(), deleteProduct);
router.post('/:id/restore', protect, checkPermission('canManageProducts'), validateObjectId(), restoreProduct);

export default router;




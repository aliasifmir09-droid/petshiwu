import express from 'express';
import {
  getCategories,
  getAllCategoriesAdmin,
  getCategory,
  createCategory,
  updateCategory,
  updateCategoryPosition,
  deleteCategory
} from '../controllers/categoryController';
import { protect, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import {
  createCategoryValidation,
  validateObjectId
} from '../middleware/validation';

const router = express.Router();

router.get('/', getCategories);
router.get('/admin/all', protect, checkPermission('canManageCategories'), getAllCategoriesAdmin);
router.get('/:id', validateObjectId(), getCategory);
router.post('/', protect, checkPermission('canManageCategories'), createCategoryValidation, createCategory);
router.put('/:id', protect, checkPermission('canManageCategories'), validateObjectId(), updateCategory);
router.put('/:id/position', protect, checkPermission('canManageCategories'), validateObjectId(), updateCategoryPosition);
router.delete('/:id', protect, checkPermission('canManageCategories'), validateObjectId(), deleteCategory);

export default router;




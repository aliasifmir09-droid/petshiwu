import express from 'express';
import {
  getPublishedBlogs,
  getBlogBySlug,
  getAllBlogsAdmin,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogCategories,
  getBlogCategoriesByPetType
} from '../controllers/blogController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getPublishedBlogs);
router.get('/categories', getBlogCategories);
router.get('/categories-by-pet-type', getBlogCategoriesByPetType);
router.get('/:slug', getBlogBySlug);

// Admin routes (require authentication and admin role)
router.get('/admin/all', protect, authorize('admin'), getAllBlogsAdmin);
router.get('/admin/:id', protect, authorize('admin'), getBlogById);
router.post('/admin', protect, authorize('admin'), createBlog);
router.put('/admin/:id', protect, authorize('admin'), updateBlog);
router.delete('/admin/:id', protect, authorize('admin'), deleteBlog);

export default router;


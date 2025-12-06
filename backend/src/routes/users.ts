import express from 'express';
import {
  getStaffUsers,
  createStaffUser,
  updateStaffUser,
  deleteStaffUser,
  getMyPermissions,
  getCustomers,
  getCustomerOrders,
  getDatabaseStats,
  addToWishlist,
  removeFromWishlist,
  getWishlist
} from '../controllers/userController';
import { shareWishlist, getSharedWishlist, emailWishlist } from '../controllers/wishlistController';
import { protect } from '../middleware/auth';
import { isAdmin, hasPermission } from '../middleware/permissions';
import {
  createStaffValidation,
  validateObjectId
} from '../middleware/validation';

const router = express.Router();

// Get current user permissions
router.get('/me/permissions', protect, getMyPermissions);

// Admin only routes - staff management
router.get('/staff', protect, isAdmin, getStaffUsers);
router.post('/staff', protect, isAdmin, createStaffValidation, createStaffUser);
router.put('/staff/:id', protect, isAdmin, validateObjectId(), updateStaffUser);
router.delete('/staff/:id', protect, isAdmin, validateObjectId(), deleteStaffUser);

// Customer management routes (admin or staff with permission)
router.get('/customers', protect, hasPermission('canManageCustomers'), getCustomers);
router.get('/customers/:customerId/orders', protect, hasPermission('canManageCustomers'), getCustomerOrders);

// Get database statistics (admin only)
router.get('/database/stats', protect, isAdmin, getDatabaseStats);

// Wishlist routes (authenticated users)
router.post('/wishlist', protect, addToWishlist);
router.delete('/wishlist', protect, removeFromWishlist);
router.get('/wishlist', protect, getWishlist);
router.get('/wishlist/share', protect, shareWishlist);
router.post('/wishlist/email', protect, emailWishlist);

// Public wishlist sharing route
router.get('/wishlist/:userId', getSharedWishlist);

export default router;


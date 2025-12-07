import express from 'express';
import {
  getStaffUsers,
  createStaffUser,
  updateStaffUser,
  deleteStaffUser,
  getMyPermissions,
  getCustomers,
  getCustomerOrders,
  deleteCustomer,
  getDatabaseStats,
  addToWishlist,
  removeFromWishlist,
  getWishlist
} from '../controllers/userController';
import { shareWishlist, getSharedWishlist, emailWishlist } from '../controllers/wishlistController';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress
} from '../controllers/addressController';
import {
  createStockAlert,
  getMyStockAlerts,
  removeStockAlert
} from '../controllers/stockAlertController';
import { protect } from '../middleware/auth';
import { isAdmin, hasPermission } from '../middleware/permissions';
import {
  createStaffValidation,
  validateObjectId,
  createAddressValidation,
  createStockAlertValidation
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
router.delete('/customers/:id', protect, hasPermission('canManageCustomers'), validateObjectId(), deleteCustomer);

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

// Address management routes
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, createAddressValidation, addAddress);
router.put('/addresses/:addressId', protect, createAddressValidation, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

// Stock alert routes
router.post('/stock-alerts', protect, createStockAlertValidation, createStockAlert);
router.get('/stock-alerts', protect, getMyStockAlerts);
router.delete('/stock-alerts/:productId', protect, validateObjectId('productId'), removeStockAlert);

export default router;


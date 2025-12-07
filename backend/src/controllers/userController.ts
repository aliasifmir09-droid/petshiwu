import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { extractObjectId, safeToObjectId } from '../utils/types';
import logger from '../utils/logger';

// Get all staff users (admin only)
export const getStaffUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const staffUsers = await User.find({ role: { $in: ['admin', 'staff'] } })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: { $in: ['admin', 'staff'] } });

    res.status(200).json({
      success: true,
      data: staffUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create staff user (admin only)
export const createStaffUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, password, phone, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create staff user
    const staffUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: 'staff',
      permissions: permissions || {
        canManageProducts: false,
        canManageOrders: false,
        canManageCustomers: false,
        canManageCategories: false,
        canViewAnalytics: false,
        canManageUsers: false,
        canManageSettings: false
      },
      isActive: true
    });

    // Remove password from response
    const staffUserObj = staffUser.toObject();
    const { password: _, ...staffUserWithoutPassword } = staffUserObj;

    res.status(201).json({
      success: true,
      data: staffUserWithoutPassword,
      message: 'Staff user created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update staff user (admin only)
export const updateStaffUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, permissions, isActive, password } = req.body;

    const staffUser = await User.findById(id);

    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent modifying the super admin (first admin user)
    if (staffUser.role === 'admin' && staffUser.email === 'admin@petshiwu.com') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify super admin account'
      });
    }

    // Update fields
    if (firstName) staffUser.firstName = firstName;
    if (lastName) staffUser.lastName = lastName;
    if (email) staffUser.email = email;
    if (phone !== undefined) staffUser.phone = phone;
    if (permissions) staffUser.permissions = permissions;
    if (isActive !== undefined) staffUser.isActive = isActive;
    if (password) staffUser.password = password; // Will be hashed by pre-save hook

    await staffUser.save();

    // Remove password from response
    const staffUserObj = staffUser.toObject();
    const { password: __, ...staffUserWithoutPassword } = staffUserObj;

    res.status(200).json({
      success: true,
      data: staffUserWithoutPassword,
      message: 'Staff user updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete staff user (admin only)
export const deleteStaffUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const staffUser = await User.findById(id);

    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting the super admin
    if (staffUser.role === 'admin' && staffUser.email === 'admin@petshiwu.com') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin account'
      });
    }

    // Prevent deleting yourself
    const staffUserId = extractObjectId(staffUser._id);
    const currentUserId = extractObjectId(req.user?._id);
    if (currentUserId && staffUserId && currentUserId.equals(staffUserId)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await staffUser.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Staff user deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get current user permissions
export const getMyPermissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Admins have all permissions
    const permissions = user.role === 'admin' ? {
      canManageProducts: true,
      canManageOrders: true,
      canManageCustomers: true,
      canManageCategories: true,
      canViewAnalytics: true,
      canManageUsers: true,
      canManageSettings: true
    } : user.permissions;

    res.status(200).json({
      success: true,
      data: {
        role: user.role,
        permissions,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all customers (admin/staff with permission)
export const getCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;

    const customers = await User.find({ role: 'customer' })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: 'customer' });

    res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get customer orders (admin/staff with permission)
export const getCustomerOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;
    
    // Dynamically import Order model to avoid circular dependency
    const Order = (await import('../models/Order')).default;

    const orders = await Order.find({ user: customerId })
      .populate('items.product', 'name imageUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// Add product to wishlist
export const addToWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.body;
    const userId = req.user?._id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Dynamically import Product model to avoid circular dependency
    const Product = (await import('../models/Product')).default;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Add to wishlist if not already there
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const productObjectId = safeToObjectId(productId);
    if (productObjectId && !user.wishlist.some(id => id.equals(productObjectId))) {
      user.wishlist.push(productObjectId);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: user.wishlist
    });
  } catch (error) {
    next(error);
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.body;
    const userId = req.user?._id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: user.wishlist
    });
  } catch (error) {
    next(error);
  }
};

// Get user wishlist with products
export const getWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    const user = await User.findById(userId).populate({
      path: 'wishlist',
      select: 'name slug images basePrice compareAtPrice brand averageRating totalReviews inStock isActive',
      match: { isActive: true } // Only get active products
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Filter out null products (in case some were deleted)
    const wishlistProducts = user.wishlist.filter((product: any) => product !== null);

    res.status(200).json({
      success: true,
      data: wishlistProducts
    });
  } catch (error) {
    next(error);
  }
};

// Delete customer and all associated data (admin only)
export const deleteCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { deleteOrders = false, anonymizeReviews = true } = req.body; // Options for data handling

    // Find the customer
    const customer = await User.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Prevent deleting admin/staff users (use deleteStaffUser for those)
    if (customer.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is for deleting customers only. Use staff deletion endpoint for admin/staff users.'
      });
    }

    const customerId = extractObjectId(customer._id);
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    // Dynamically import models to avoid circular dependencies
    const Order = (await import('../models/Order')).default;
    const Review = (await import('../models/Review')).default;
    const Return = (await import('../models/Return')).default;
    const StockAlert = (await import('../models/StockAlert')).default;
    const Donation = (await import('../models/Donation')).default;

    // Get counts before deletion for response
    const orderCount = await Order.countDocuments({ user: customerId });
    const reviewCount = await Review.countDocuments({ user: customerId });
    const returnCount = await Return.countDocuments({ user: customerId });
    const stockAlertCount = await StockAlert.countDocuments({ user: customerId });
    const donationCount = await Donation.countDocuments({ user: customerId });

    // Delete or handle associated data
    const deletionSummary: any = {
      user: customer.email,
      orders: { count: orderCount, deleted: 0, kept: 0 },
      reviews: { count: reviewCount, deleted: 0, anonymized: 0 },
      returns: { count: returnCount, deleted: 0 },
      stockAlerts: { count: stockAlertCount, deleted: 0 },
      donations: { count: donationCount, deleted: 0 },
      wishlist: { count: customer.wishlist.length, cleared: true },
      addresses: { count: customer.addresses.length, cleared: true }
    };

    // 1. Handle Orders
    if (deleteOrders) {
      // Delete all orders
      const orderResult = await Order.deleteMany({ user: customerId });
      deletionSummary.orders.deleted = orderResult.deletedCount || 0;
    } else {
      // Keep orders but remove user reference (anonymize)
      // Note: Orders might need to be kept for legal/compliance reasons
      deletionSummary.orders.kept = orderCount;
      logger.info(`Keeping ${orderCount} orders for customer ${customer.email} (for records)`);
    }

    // 2. Handle Reviews
    if (anonymizeReviews) {
      // Anonymize reviews (keep them but remove user reference)
      const reviewResult = await Review.updateMany(
        { user: customerId },
        { $unset: { user: '' } }
      );
      deletionSummary.reviews.anonymized = reviewResult.modifiedCount || 0;
    } else {
      // Delete reviews completely
      const reviewResult = await Review.deleteMany({ user: customerId });
      deletionSummary.reviews.deleted = reviewResult.deletedCount || 0;
    }

    // Remove user from helpfulUsers and notHelpfulUsers arrays in reviews
    await Review.updateMany(
      { helpfulUsers: customerId },
      { $pull: { helpfulUsers: customerId }, $inc: { helpfulCount: -1 } }
    );
    await Review.updateMany(
      { notHelpfulUsers: customerId },
      { $pull: { notHelpfulUsers: customerId }, $inc: { notHelpfulCount: -1 } }
    );

    // 3. Delete Returns
    const returnResult = await Return.deleteMany({ user: customerId });
    deletionSummary.returns.deleted = returnResult.deletedCount || 0;

    // 4. Delete Stock Alerts
    const stockAlertResult = await StockAlert.deleteMany({ user: customerId });
    deletionSummary.stockAlerts.deleted = stockAlertResult.deletedCount || 0;

    // 5. Delete Donations (optional - might want to keep for records)
    const donationResult = await Donation.deleteMany({ user: customerId });
    deletionSummary.donations.deleted = donationResult.deletedCount || 0;

    // 6. Delete the user
    await customer.deleteOne();

    logger.info(`Customer ${customer.email} and associated data deleted:`, deletionSummary);

    res.status(200).json({
      success: true,
      message: 'Customer and associated data deleted successfully',
      data: deletionSummary
    });
  } catch (error) {
    next(error);
  }
};

// Get database statistics (admin only)
export const getDatabaseStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Dynamically import models to avoid circular dependencies
    const Order = (await import('../models/Order')).default;
    const Product = (await import('../models/Product')).default;
    const Category = (await import('../models/Category')).default;
    const Review = (await import('../models/Review')).default;
    const Donation = (await import('../models/Donation')).default;

    // Get counts for all collections
    const stats = {
      users: {
        total: await User.countDocuments(),
        customers: await User.countDocuments({ role: 'customer' }),
        admins: await User.countDocuments({ role: 'admin' }),
        staff: await User.countDocuments({ role: 'staff' }),
        active: await User.countDocuments({ isActive: true }),
        inactive: await User.countDocuments({ isActive: false })
      },
      products: {
        total: await Product.countDocuments(),
        active: await Product.countDocuments({ isActive: true }),
        inactive: await Product.countDocuments({ isActive: false }),
        inStock: await Product.countDocuments({ 'variants.0.stock': { $gt: 0 } }),
        outOfStock: await Product.countDocuments({ 'variants.0.stock': { $lte: 0 } })
      },
      orders: {
        total: await Order.countDocuments(),
        pending: await Order.countDocuments({ orderStatus: 'pending' }),
        processing: await Order.countDocuments({ orderStatus: 'processing' }),
        shipped: await Order.countDocuments({ orderStatus: 'shipped' }),
        delivered: await Order.countDocuments({ orderStatus: 'delivered' }),
        cancelled: await Order.countDocuments({ orderStatus: 'cancelled' })
      },
      categories: {
        total: await Category.countDocuments(),
        active: await Category.countDocuments({ isActive: true })
      },
      reviews: {
        total: await Review.countDocuments(),
        approved: await Review.countDocuments({ isApproved: true }),
        pending: await Review.countDocuments({ isApproved: false })
      },
      donations: {
        total: await Donation.countDocuments(),
        completed: await Donation.countDocuments({ status: 'completed' }),
        pending: await Donation.countDocuments({ status: 'pending' })
      }
    };

    // Calculate total revenue from paid orders
    const paidOrders = await Order.find({ paymentStatus: 'paid' }).select('totalPrice donationAmount');
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalDonations = paidOrders.reduce((sum, order) => sum + (order.donationAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        financial: {
          totalRevenue,
          totalDonations,
          totalWithDonations: totalRevenue + totalDonations
        }
      }
    });
  } catch (error) {
    next(error);
  }
};


import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

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
    delete staffUserObj.password;

    res.status(201).json({
      success: true,
      data: staffUserObj,
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
    delete staffUserObj.password;

    res.status(200).json({
      success: true,
      data: staffUserObj,
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
    if (staffUser._id.toString() === req.user?._id.toString()) {
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


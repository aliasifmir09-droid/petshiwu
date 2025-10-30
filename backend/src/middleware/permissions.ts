import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

// Check if user is admin (full access)
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// Check if user is admin or staff
export const isAdminOrStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or staff only.'
    });
  }
  next();
};

// Check specific permission
export const hasPermission = (permission: keyof import('../models/User').IPermissions) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Admins have all permissions
    if (req.user?.role === 'admin') {
      return next();
    }

    // Staff need specific permission
    if (req.user?.role === 'staff') {
      if (req.user.permissions && req.user.permissions[permission]) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. ${permission} permission required.`
    });
  };
};

// Alias for backwards compatibility
export const checkPermission = hasPermission;

// Permission helpers for common actions
export const canManageProducts = hasPermission('canManageProducts');
export const canManageOrders = hasPermission('canManageOrders');
export const canManageCustomers = hasPermission('canManageCustomers');
export const canManageCategories = hasPermission('canManageCategories');
export const canViewAnalytics = hasPermission('canViewAnalytics');
export const canManageUsers = hasPermission('canManageUsers');
export const canManageSettings = hasPermission('canManageSettings');


/// <reference types="node" />
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import logger from '../utils/logger';

// Extend Express Request type to include cookies
declare global {
  namespace Express {
    interface Request {
      cookies?: {
        [key: string]: string;
      };
    }
  }
}

// Use type intersection to ensure all Request properties are included
export type AuthRequest = Request & {
  user?: IUser;
};

// Helper function to detect if request is from admin dashboard
const isAdminRequest = (req: Request): boolean => {
  const origin = req.headers?.origin || req.headers?.referer || '';
  const adminUrls = [
    process.env.ADMIN_URL || 'http://localhost:5174',
    'https://pet-shop-2-r3ed.onrender.com',
    'https://dashboard.petshiwu.com',
  ];
  
  // Check if origin matches admin URLs
  return adminUrls.some(url => origin.includes(url) || origin.includes('5174') || origin.includes('dashboard'));
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token;

    // Check for token in appropriate cookie based on request origin
    // Use separate cookies for frontend and admin to prevent cross-contamination
    const isAdmin = isAdminRequest(req);
    if (isAdmin) {
      token = req.cookies?.admin_token;
    } else {
      token = req.cookies?.frontend_token;
    }
    
    // Fallback to old cookie name for backward compatibility (migration period)
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      // Debug: Log minimal information in development only
      // Never log cookie values, headers, or sensitive request data
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Auth Debug - No token found:', {
          hasCookies: !!req.cookies,
          cookieCount: req.cookies ? Object.keys(req.cookies).length : 0,
          url: req.url,
          method: req.method
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please log in again.',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration error'
        });
      }
      // Explicitly specify algorithm to prevent algorithm confusion attacks
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { id: string };
      
      // Don't select password field for security
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = user;
      next();
    } catch (error: unknown) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Does NOT return 401 if no token - instead sets req.user to null
 * Useful for endpoints that need to check auth status without requiring authentication
 */
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token;

    // Check for token in appropriate cookie based on request origin
    // Use separate cookies for frontend and admin to prevent cross-contamination
    const isAdmin = isAdminRequest(req);
    if (isAdmin) {
      token = req.cookies?.admin_token;
    } else {
      token = req.cookies?.frontend_token;
    }
    
    // Fallback to old cookie name for backward compatibility (migration period)
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      // No token - set user to null and continue (don't return 401)
      req.user = undefined;
      return next();
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        // Server error - set user to null and continue
        req.user = undefined;
        return next();
      }
      
      // Verify token
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { id: string };
      
      // Find user
      const user = await User.findById(decoded.id);

      if (!user) {
        // User not found - set user to null and continue (don't return 401)
        req.user = undefined;
        return next();
      }

      // User found - set req.user and continue
      req.user = user;
      next();
    } catch (error: unknown) {
      // Invalid/expired token - set user to null and continue (don't return 401)
      if (process.env.NODE_ENV === 'development') {
        logger.debug('OptionalAuth: Token verification failed (expected if not logged in)');
      }
      req.user = undefined;
      next();
    }
  } catch (error: unknown) {
    // Any other error - log in development, set user to null and continue
    if (process.env.NODE_ENV === 'development') {
      logger.error('OptionalAuth error:', error);
    }
    req.user = undefined;
    next();
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};




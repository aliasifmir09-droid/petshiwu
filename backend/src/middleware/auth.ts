/// <reference types="node" />
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

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

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token;

    // Phase 2: Cookie-Only - Only accept token from httpOnly cookie (more secure)
    // Removed Authorization header support for better security
    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      // Debug: Log minimal information in development only
      // Never log cookie values, headers, or sensitive request data
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth Debug - No token found:', {
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

    // Check for token in httpOnly cookie
    if (req.cookies?.token) {
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
      req.user = undefined;
      next();
    }
  } catch (error) {
    // Any other error - set user to null and continue
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




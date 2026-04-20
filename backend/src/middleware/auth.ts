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
  return adminUrls.some(url => origin.includes(url) || origin.includes('5174') || origin.includes('dashboard'));
};

// FIX: Helper to extract token from request
// Checks cookies first, then falls back to Authorization header
// This fixes cross-domain auth where cookies are rejected by browser
const extractToken = (req: Request): string | undefined => {
  const isAdmin = isAdminRequest(req);

  // 1. Try cookies first (works when same domain)
  let token: string | undefined;
  if (isAdmin) {
    token = req.cookies?.admin_token;
  } else {
    token = req.cookies?.frontend_token;
  }

  // 2. Fallback to old cookie name (backward compatibility)
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  // 3. FIX: Fallback to Authorization header (fixes cross-domain cookie rejection)
  // When frontend (petshiwu.com) calls backend (onrender.com), cookies are rejected
  // So we also accept Bearer token from Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  return token;
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);

    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Auth Debug - No token found:', {
          hasCookies: !!req.cookies,
          cookieCount: req.cookies ? Object.keys(req.cookies).length : 0,
          hasAuthHeader: !!req.headers.authorization,
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

      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { id: string };
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
 */
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);

    if (!token) {
      req.user = undefined;
      return next();
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        req.user = undefined;
        return next();
      }

      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { id: string };
      const user = await User.findById(decoded.id);

      if (!user) {
        req.user = undefined;
        return next();
      }

      req.user = user;
      next();
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('OptionalAuth: Token verification failed (expected if not logged in)');
      }
      req.user = undefined;
      next();
    }
  } catch (error: unknown) {
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

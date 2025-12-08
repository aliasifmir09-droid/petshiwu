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
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
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




import { Request, Response, NextFunction } from 'express';
import { isDatabaseConnected } from '../utils/database';

/**
 * Middleware to check if database is connected before processing requests
 * Returns 503 Service Unavailable if database is not connected
 * 
 * In production with buffering enabled, Mongoose will queue operations,
 * but we still check connection state to provide immediate feedback.
 */
export const checkDatabase = (req: Request, res: Response, next: NextFunction) => {
  if (!isDatabaseConnected()) {
    const isProduction = process.env.NODE_ENV === 'production';
    return res.status(503).json({
      success: false,
      message: isProduction 
        ? 'Database connection temporarily unavailable. Please try again in a moment.'
        : 'Database connection unavailable. Please check if MongoDB is running.',
      code: 'DATABASE_UNAVAILABLE',
      retryable: isProduction // Indicates if client should retry
    });
  }
  next();
};


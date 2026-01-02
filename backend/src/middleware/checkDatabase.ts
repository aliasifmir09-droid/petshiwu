import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
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
    const readyState = mongoose.connection.readyState;
    const stateMessages: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    // Add Retry-After header for production to help clients with retry logic
    if (isProduction) {
      res.setHeader('Retry-After', '30'); // Suggest retrying after 30 seconds
    }
    
    return res.status(503).json({
      success: false,
      message: isProduction 
        ? 'Database connection temporarily unavailable. Please try again in a moment.'
        : 'Database connection unavailable. Please check if MongoDB is running.',
      code: 'DATABASE_UNAVAILABLE',
      retryable: isProduction, // Indicates if client should retry
      state: stateMessages[readyState] || 'unknown',
      // Only include detailed state in development
      ...(isProduction ? {} : {
        readyState,
        suggestion: readyState === 2 
          ? 'Database is connecting. Please wait a moment and try again.'
          : 'Check MongoDB connection string and ensure MongoDB service is running.'
      })
    });
  }
  next();
};


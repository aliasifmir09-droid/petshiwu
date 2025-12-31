/// <reference types="node" />
import { Request, Response, NextFunction } from 'express';
import { safeError } from './sanitizeLogs';
import { AppError, createErrorResponse } from '../utils/errors';
import logger from '../utils/logger';
import { recordError, addCustomAttribute } from '../utils/apm';

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  let error: { message: string; statusCode: number; name?: string } = {
    message: err.message || 'An error occurred',
    statusCode: err instanceof AppError ? err.statusCode : 500
  };

  // Log error safely (sanitizes sensitive data)
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`Operational error: ${err.message}`);
  } else {
    safeError('Error occurred:', err);
  }

  // Record error to APM
  recordError(err, {
    url: req.originalUrl,
    method: req.method,
    statusCode: error.statusCode,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });
  
  // Add error context to APM
  addCustomAttribute('error.name', err.name || 'Error');
  addCustomAttribute('error.statusCode', error.statusCode);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if ('code' in err && err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  // SECURITY FIX: Use generic message in production to prevent information disclosure
  if (err.name === 'ValidationError') {
    const mongooseError = err as { errors?: Record<string, { message: string }> };
    if (process.env.NODE_ENV === 'production') {
      // Generic message in production to prevent information disclosure
      error = { message: 'Validation failed. Please check your input and try again.', statusCode: 400 };
      // Log detailed error server-side only
      if (mongooseError.errors) {
        const detailedErrors = Object.values(mongooseError.errors).map((val) => val.message).join(', ');
        logger.warn('Validation error details (server-side only):', detailedErrors);
      }
    } else {
      // Detailed message in development for debugging
      const message = mongooseError.errors 
        ? Object.values(mongooseError.errors)
            .map((val) => val.message)
            .join(', ')
        : 'Validation error';
      error = { message, statusCode: 400 };
    }
  }

  // JWT errors - don't expose details
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = { 
      message: 'Invalid or expired token', 
      statusCode: 401 
    };
  }

  // Database connection errors - don't expose connection strings
  if (err.name === 'MongoServerError' || err.name === 'MongooseError') {
    error = {
      message: 'Database operation failed',
      statusCode: 500
    };
  }

  // Use standardized error response
  const response = createErrorResponse(err, error.message);

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    (response as { stack?: string; error?: string }).stack = err.stack;
    (response as { stack?: string; error?: string }).error = err.name;
  }

  res.status(error.statusCode || 500).json(response);
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};




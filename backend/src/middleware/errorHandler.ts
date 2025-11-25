/// <reference types="node" />
import { Request, Response, NextFunction } from 'express';
import { safeError } from './sanitizeLogs';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log error safely (sanitizes sensitive data)
  safeError('Error occurred:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(', ');
    error = { message, statusCode: 400 };
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

  // Response - never expose stack traces or sensitive info in production
  const response: any = {
    success: false,
    message: error.message || 'An error occurred'
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err.name;
  }

  res.status(error.statusCode || 500).json(response);
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};




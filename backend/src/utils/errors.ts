/**
 * Custom error classes for standardized error handling
 */

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string[]>) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AsyncRequestHandler } from '../types/common';

/**
 * Standardized error handler wrapper for async controller functions
 * Provides proper TypeScript types instead of 'any'
 */
export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request | AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create standardized error response
 */
export const createErrorResponse = (
  error: Error | AppError,
  defaultMessage: string = 'An error occurred'
) => {
  if (error instanceof AppError) {
    return {
      success: false,
      message: error.message,
      ...(error instanceof ValidationError && error.fields && { errors: error.fields })
    };
  }

  return {
    success: false,
    message: error.message || defaultMessage
  };
};


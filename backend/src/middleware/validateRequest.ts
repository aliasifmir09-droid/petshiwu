/// <reference types="node" />
import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

/**
 * Validate request and return errors if any
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Common validation rules
 */
export const validators = {
  // ObjectId validation
  mongoId: param('id').isMongoId().withMessage('Invalid ID format'),
  
  // Pagination
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  
  // Email validation
  email: body('email').isEmail().withMessage('Invalid email address'),
  
  // Password validation
  password: body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  // String validation
  string: (field: string, minLength = 1, maxLength = 500) => 
    body(field).trim().isLength({ min: minLength, max: maxLength }).withMessage(`${field} must be between ${minLength} and ${maxLength} characters`),
  
  // Number validation
  number: (field: string, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    body(field).isFloat({ min, max }).withMessage(`${field} must be a number between ${min} and ${max}`),
  
  // URL validation
  url: body('url').optional().isURL().withMessage('Invalid URL format'),
  
  // Array validation
  array: (field: string, minItems = 0, maxItems = 100) =>
    body(field).optional().isArray({ min: minItems, max: maxItems }).withMessage(`${field} must be an array with ${minItems}-${maxItems} items`)
};


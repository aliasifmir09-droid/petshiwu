import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Validation error handler
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg
      }))
    });
  }
  next();
};

// Sanitize string inputs (trim, escape)
const sanitizeString = (field: string) => 
  body(field)
    .trim()
    .escape()
    .notEmpty()
    .withMessage(`${field} is required`);

// Auth validations
export const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must contain only letters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must contain only letters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format'),
  validate
];

export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

export const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  validate
];

// Product validations
export const createProductValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('brand')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .withMessage('Invalid brand name'),
  body('category')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid category ID'),
  body('basePrice')
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Base price must be a positive number'),
    body('petType')
      .notEmpty()
      .withMessage('Pet type is required')
      .isString()
      .withMessage('Pet type must be a valid string'),
  validate
];

// Category validations
export const createCategoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z0-9\s\-&]+$/)
    .withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('petType')
    .optional()
    .isString()
    .withMessage('Pet type must be a valid string'),
  validate
];

// Order validations
export const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.product')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid product ID'),
  body('items.*.name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),
  body('items.*.image')
    .trim()
    .notEmpty()
    .withMessage('Product image is required'),
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Product price must be a positive number'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
  body('shippingAddress.firstName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Invalid first name'),
  body('shippingAddress.lastName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Invalid last name'),
  body('shippingAddress.street')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s\-\.\']+$/)
    .withMessage('Invalid city name'),
  body('shippingAddress.state')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Invalid state'),
  body('shippingAddress.zipCode')
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid ZIP code'),
  body('shippingAddress.country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  body('shippingAddress.phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('paymentMethod')
    .isIn(['credit_card', 'paypal', 'apple_pay', 'google_pay', 'cod'])
    .withMessage('Invalid payment method'),
  body('itemsPrice')
    .isFloat({ min: 0 })
    .withMessage('Invalid items price'),
  body('shippingPrice')
    .isFloat({ min: 0 })
    .withMessage('Invalid shipping price'),
  body('taxPrice')
    .isFloat({ min: 0 })
    .withMessage('Invalid tax price'),
  body('totalPrice')
    .isFloat({ min: 0 })
    .withMessage('Invalid total price'),
  validate
];

// Review validations
export const createReviewValidation = [
  body('product')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid product ID'),
  body('orderId')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid order ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters'),
  validate
];

// MongoDB ObjectId validation
export const validateObjectId = (paramName: string = 'id') => [
  param(paramName)
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid ID format'),
  validate
];

// Query parameter validation
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  validate
];

// Staff user validation
export const createStaffValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must contain only letters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must contain only letters'),
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object'),
  validate
];



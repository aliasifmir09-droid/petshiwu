import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Validation error handler
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return res.status(400).json({
      success: false,
      message: errorMessages[0] || 'Validation failed', // Include first error as message
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
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
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
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  validate
];

export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
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
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  validate
];

export const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  validate
];

export const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  validate
];

// Product validations
export const createProductValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),
  body('basePrice')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('category')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid category ID'),
  body('petType')
    .optional()
    .trim()
    .isIn(['dog', 'cat', 'bird', 'fish', 'reptile', 'small_animal', 'all'])
    .withMessage('Invalid pet type'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Brand must be less than 100 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be less than 50 characters'),
  validate
];

// Category validations
export const createCategoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('petType')
    .trim()
    .isIn(['dog', 'cat', 'bird', 'fish', 'reptile', 'small_animal', 'all'])
    .withMessage('Invalid pet type'),
  body('parentCategory')
    .optional()
    .custom((value) => !value || mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid parent category ID'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  validate
];

// Order validations
export const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must have at least one item'),
  body('items.*.product')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid product ID'),
  body('items.*.name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required'),
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Item price must be a positive number'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Item quantity must be at least 1'),
  body('shippingAddress.firstName')
    .trim()
    .notEmpty()
    .withMessage('Shipping address first name is required'),
  body('shippingAddress.lastName')
    .trim()
    .notEmpty()
    .withMessage('Shipping address last name is required'),
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Shipping address street is required'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('Shipping address city is required'),
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('Shipping address state is required'),
  body('shippingAddress.zipCode')
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid zip code format'),
  body('shippingAddress.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
  body('shippingAddress.phone')
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
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
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
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
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  body('videos')
    .optional()
    .isArray()
    .withMessage('Videos must be an array'),
  body('videos.*')
    .optional()
    .isURL()
    .withMessage('Each video must be a valid URL'),
  validate
];

// Return validations
export const createReturnValidation = [
  body('orderId')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid order ID'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Return must have at least one item'),
  body('items.*.productId')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid product ID'),
  body('items.*.orderItemId')
    .notEmpty()
    .withMessage('Order item ID is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Return quantity must be at least 1'),
  body('items.*.reason')
    .isIn(['defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged', 'other'])
    .withMessage('Invalid return reason'),
  body('items.*.condition')
    .isIn(['unopened', 'opened', 'damaged', 'defective'])
    .withMessage('Invalid item condition'),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Return reason must be between 10 and 500 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  validate
];

// Address validations
export const createAddressValidation = [
  body('street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('zipCode')
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid zip code format'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
  validate
];

// Stock alert validations
export const createStockAlertValidation = [
  body('productId')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid product ID'),
  validate
];

// Search validations
export const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),
  query('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock must be a boolean'),
  query('sort')
    .optional()
    .isIn(['newest', 'price-asc', 'price-desc', 'rating', 'name-asc', 'name-desc'])
    .withMessage('Invalid sort option'),
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
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate
];

// Admin pagination validation - allows higher limits for admin endpoints
export const adminPaginationValidation = [
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
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
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

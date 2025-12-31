import { Request, Response, NextFunction } from 'express';
import PaymentMethod from '../models/PaymentMethod';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: {
    _id: mongoose.Types.ObjectId;
    email?: string;
    firstName?: string;
  };
}

/**
 * Get all saved payment methods for current user
 * GET /api/payment-methods
 */
export const getPaymentMethods = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const paymentMethods = await PaymentMethod.find({ user: userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    // Sanitize sensitive data - only return safe fields
    const sanitized = paymentMethods.map((pm: any) => ({
      _id: pm._id,
      type: pm.type,
      last4: pm.last4,
      brand: pm.brand,
      expiryMonth: pm.expiryMonth,
      expiryYear: pm.expiryYear,
      isDefault: pm.isDefault,
      billingAddress: pm.billingAddress,
      createdAt: pm.createdAt,
      updatedAt: pm.updatedAt
      // Don't return stripePaymentMethodId or paypalAccountId for security
    }));

    res.status(200).json({
      success: true,
      data: sanitized
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save a new payment method
 * POST /api/payment-methods
 */
export const savePaymentMethod = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const {
      type,
      stripePaymentMethodId,
      paypalAccountId,
      last4,
      brand,
      expiryMonth,
      expiryYear,
      isDefault = false,
      billingAddress
    } = req.body;

    // Validate required fields based on type
    if (type === 'credit_card' || type === 'apple_pay' || type === 'google_pay') {
      if (!stripePaymentMethodId) {
        throw new AppError('Stripe payment method ID is required', 400);
      }
    } else if (type === 'paypal') {
      if (!paypalAccountId) {
        throw new AppError('PayPal account ID is required', 400);
      }
    }

    // Create payment method
    const paymentMethod = await PaymentMethod.create({
      user: userId,
      type,
      stripePaymentMethodId,
      paypalAccountId,
      last4,
      brand,
      expiryMonth,
      expiryYear,
      isDefault,
      billingAddress
    });

    res.status(201).json({
      success: true,
      data: {
        _id: paymentMethod._id,
        type: paymentMethod.type,
        last4: paymentMethod.last4,
        brand: paymentMethod.brand,
        expiryMonth: paymentMethod.expiryMonth,
        expiryYear: paymentMethod.expiryYear,
        isDefault: paymentMethod.isDefault,
        billingAddress: paymentMethod.billingAddress,
        createdAt: paymentMethod.createdAt,
        updatedAt: paymentMethod.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a payment method
 * PUT /api/payment-methods/:id
 */
export const updatePaymentMethod = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { isDefault, billingAddress } = req.body;

    const paymentMethod = await PaymentMethod.findOne({ _id: id, user: userId });
    if (!paymentMethod) {
      throw new AppError('Payment method not found', 404);
    }

    if (isDefault !== undefined) {
      paymentMethod.isDefault = isDefault;
    }
    if (billingAddress) {
      paymentMethod.billingAddress = billingAddress;
    }

    await paymentMethod.save();

    res.status(200).json({
      success: true,
      data: {
        _id: paymentMethod._id,
        type: paymentMethod.type,
        last4: paymentMethod.last4,
        brand: paymentMethod.brand,
        expiryMonth: paymentMethod.expiryMonth,
        expiryYear: paymentMethod.expiryYear,
        isDefault: paymentMethod.isDefault,
        billingAddress: paymentMethod.billingAddress,
        createdAt: paymentMethod.createdAt,
        updatedAt: paymentMethod.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a payment method
 * DELETE /api/payment-methods/:id
 */
export const deletePaymentMethod = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

    const paymentMethod = await PaymentMethod.findOneAndDelete({ _id: id, user: userId });
    if (!paymentMethod) {
      throw new AppError('Payment method not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get default payment method for user
 * GET /api/payment-methods/default
 */
export const getDefaultPaymentMethod = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const paymentMethod = await PaymentMethod.findOne({ user: userId, isDefault: true }).lean();

    if (!paymentMethod) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    // Sanitize sensitive data
    res.status(200).json({
      success: true,
      data: {
        _id: paymentMethod._id,
        type: paymentMethod.type,
        last4: paymentMethod.last4,
        brand: paymentMethod.brand,
        expiryMonth: paymentMethod.expiryMonth,
        expiryYear: paymentMethod.expiryYear,
        isDefault: paymentMethod.isDefault,
        billingAddress: paymentMethod.billingAddress,
        createdAt: paymentMethod.createdAt,
        updatedAt: paymentMethod.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};


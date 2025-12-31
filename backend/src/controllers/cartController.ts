import { Request, Response, NextFunction } from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';
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
 * Save or update cart
 * POST /api/cart
 */
export const saveCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const sessionId = (req as any).sessionID || req.headers['x-session-id'] as string;
    const { items, shareId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart items are required'
      });
    }

    // Validate items and fetch product details
    const validatedItems = [];
    for (const item of items) {
      if (!item.product || !item.quantity || !item.price || !item.name) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart item format'
        });
      }

      // Verify product exists
      const product = await Product.findById(item.product);
      if (!product) {
        logger.warn(`Product ${item.product} not found in cart save`);
        continue; // Skip invalid products
      }

      validatedItems.push({
        product: item.product,
        variant: item.variant || undefined,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image || product.images?.[0]
      });
    }

    if (validatedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid items in cart'
      });
    }

    // Find or create cart
    let cart;
    if (userId) {
      cart = await Cart.findOne({ user: userId });
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId });
    } else {
      return res.status(400).json({
        success: false,
        message: 'User or session ID required'
      });
    }

    if (cart) {
      // Update existing cart
      cart.items = validatedItems;
      cart.lastUpdated = new Date();
      cart.abandonedAt = undefined; // Reset abandonment if cart is updated
      cart.recoveryEmailSent = false;
      if (shareId) {
        cart.shareId = shareId;
      }
      await cart.save();
    } else {
      // Create new cart
      const cartData: any = {
        items: validatedItems,
        lastUpdated: new Date()
      };

      if (userId) {
        cartData.user = userId;
      } else {
        cartData.sessionId = sessionId;
      }

      if (shareId) {
        cartData.shareId = shareId;
      }

      cart = await Cart.create(cartData);
    }

    res.status(200).json({
      success: true,
      data: {
        cartId: cart._id,
        shareId: cart.shareId,
        items: cart.items,
        lastUpdated: cart.lastUpdated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get cart
 * GET /api/cart
 */
export const getCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const sessionId = (req as any).sessionID || req.headers['x-session-id'] as string;

    let cart;
    if (userId) {
      cart = await Cart.findOne({ user: userId }).populate('items.product', 'name images basePrice inStock totalStock');
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId }).populate('items.product', 'name images basePrice inStock totalStock');
    } else {
      return res.status(200).json({
        success: true,
        data: { items: [] }
      });
    }

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { items: [] }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        cartId: cart._id,
        shareId: cart.shareId,
        items: cart.items,
        lastUpdated: cart.lastUpdated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shared cart
 * GET /api/cart/share/:shareId
 */
export const getSharedCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shareId } = req.params;

    const cart = await Cart.findOne({ shareId }).populate('items.product', 'name images basePrice inStock totalStock');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Shared cart not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        items: cart.items,
        shareId: cart.shareId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear cart
 * DELETE /api/cart
 */
export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const sessionId = (req as any).sessionID || req.headers['x-session-id'] as string;

    if (userId) {
      await Cart.deleteOne({ user: userId });
    } else if (sessionId) {
      await Cart.deleteOne({ sessionId });
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate estimated delivery date
 * Helper function
 */
export const calculateEstimatedDelivery = (shippingMethod: string = 'standard'): Date => {
  const now = new Date();
  const deliveryDays = {
    standard: 5, // 5 business days
    express: 2, // 2 business days
    overnight: 1 // 1 business day
  };

  const days = deliveryDays[shippingMethod as keyof typeof deliveryDays] || deliveryDays.standard;
  
  // Add business days (skip weekends)
  let date = new Date(now);
  let addedDays = 0;
  
  while (addedDays < days) {
    date.setDate(date.getDate() + 1);
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      addedDays++;
    }
  }

  return date;
};

/**
 * Get estimated delivery date
 * GET /api/cart/delivery-estimate
 */
export const getDeliveryEstimate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shippingMethod = 'standard' } = req.query;

    const estimatedDelivery = calculateEstimatedDelivery(shippingMethod as string);

    res.status(200).json({
      success: true,
      data: {
        estimatedDelivery: estimatedDelivery.toISOString(),
        shippingMethod
      }
    });
  } catch (error) {
    next(error);
  }
};


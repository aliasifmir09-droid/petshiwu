import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { safeToString, extractObjectId } from '../utils/types';
import { asyncHandler, NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors';
import { sendOrderConfirmationEmail, sendOrderCancellationEmail, sendOrderDeliveredEmail } from '../utils/emailService';
import logger from '../utils/logger';

import type { StripeInstance, OrderItemInput, NormalizedOrderItem, NormalizedOrder } from '../types/common';

// Initialize Stripe (optional - only if STRIPE_SECRET_KEY is set)
let stripe: StripeInstance | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    // Dynamic import to avoid errors if stripe package isn't installed
    // @ts-ignore - Stripe may not be installed, handled in try-catch
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
  }
} catch (error) {
  // Stripe package not installed - payments will not work
  // This is okay if payments are not being used
}

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingAddress
 *               - paymentMethod
 *               - itemsPrice
 *               - shippingPrice
 *               - taxPrice
 *               - totalPrice
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product
 *                     - quantity
 *                     - price
 *                     - name
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - street
 *                   - city
 *                   - state
 *                   - zipCode
 *                   - firstName
 *                   - lastName
 *                   - phone
 *               billingAddress:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, paypal, stripe]
 *               itemsPrice:
 *                 type: number
 *               shippingPrice:
 *                 type: number
 *               taxPrice:
 *                 type: number
 *               donationAmount:
 *                 type: number
 *               totalPrice:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Not authenticated
 */
// Create new order
export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      donationAmount,
      totalPrice,
      notes
    } = req.body;

    // Validate user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate items exist
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items'
      });
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is incomplete',
        errors: ['Street, city, state, and zip code are required']
      });
    }

    // Normalize product IDs and validate items
    const normalizedItems = items.map((item: OrderItemInput): NormalizedOrderItem => {
      // Convert product ID to string if it's an object
      let productId: string | null = null;
      const rawProductId = item.product;
      
      if (!rawProductId) {
        throw new Error(`Product ID is missing for item: ${item.name || 'Unknown'}`);
      }
      
      // Handle different types of product IDs
      productId = safeToString(rawProductId);
      
      // Validate MongoDB ObjectId format
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error(`Invalid product ID for item: ${item.name || 'Unknown'}`);
      }
      
      return {
        ...item,
        product: productId
      };
    });

    // Use MongoDB transaction to ensure atomic stock updates
    // Skip transactions in test mode (standalone MongoDB doesn't support transactions)
    const useTransactions = process.env.NODE_ENV !== 'test';
    
    let session: mongoose.ClientSession | null = null;
    if (useTransactions) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (error: unknown) {
        // If transaction fails (e.g., no replica set), continue without it
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('replica set')) {
          session = null;
        } else {
          throw error;
        }
      }
    }

    try {
      // Step 1: Verify stock availability and prepare stock updates
      const stockUpdates: Array<{
        productId: string;
        quantity: number;
        variantSku?: string;
      }> = [];

      for (const item of normalizedItems) {
        const productId = item.product;
        const quantity = item.quantity || 1;
        
        // Find product with lock (within transaction if available)
        const product = session ? await Product.findById(productId).session(session) : await Product.findById(productId);
        
        if (!product) {
          throw new Error(`Product ${item.name || productId} not found`);
        }
        
        if (!product.inStock) {
          throw new Error(`Product "${item.name}" is currently out of stock`);
        }

        // Handle variant stock if item has a variant SKU
        if (item.variant && item.variant.sku) {
          const variant = product.variants.find((v) => v.sku === item.variant?.sku);
          if (!variant) {
            throw new Error(`Variant with SKU "${item.variant.sku}" not found for product "${item.name}"`);
          }
          if (variant.stock < quantity) {
            throw new Error(`Insufficient stock for variant "${item.variant.sku}" of product "${item.name}". Available: ${variant.stock}, Requested: ${quantity}`);
          }
          stockUpdates.push({ productId, quantity, variantSku: item.variant.sku });
        } else {
          // Check total stock for products without variants or when variant not specified
          if (product.totalStock < quantity) {
            throw new Error(`Insufficient stock for product "${item.name}". Available: ${product.totalStock}, Requested: ${quantity}`);
          }
          stockUpdates.push({ productId, quantity });
        }
      }

      // Step 2: Atomically update stock using $inc with conditions
      for (const update of stockUpdates) {
        if (update.variantSku) {
          // Update variant stock atomically
          const variantUpdateResult = await Product.updateOne(
            {
              _id: update.productId,
              'variants.sku': update.variantSku,
              'variants.stock': { $gte: update.quantity } // Only update if sufficient stock
            },
            {
              $inc: { 
                'variants.$.stock': -update.quantity,
                totalStock: -update.quantity
              }
            },
            session ? { session } : {}
          );

          if (variantUpdateResult.matchedCount === 0) {
            throw new Error(`Insufficient stock for variant SKU "${update.variantSku}"`);
          }
        } else {
          // Update total stock atomically
          const productUpdateResult = await Product.updateOne(
            {
              _id: update.productId,
              totalStock: { $gte: update.quantity } // Only update if sufficient stock
            },
            {
              $inc: { totalStock: -update.quantity }
            },
            session ? { session } : {}
          );

          if (productUpdateResult.matchedCount === 0) {
            const product = session ? await Product.findById(update.productId).session(session) : await Product.findById(update.productId);
            throw new Error(`Insufficient stock for product. Available: ${product?.totalStock || 0}, Requested: ${update.quantity}`);
          }
        }

        // Update inStock flag based on new totalStock
        await Product.updateOne(
          { _id: update.productId },
          [
            {
              $set: {
                inStock: { $gt: ['$totalStock', 0] }
              }
            }
          ],
          session ? { session } : {}
        );
      }

      // Step 3: Verify payment for online payment methods (not COD)
      let paymentIntentId: string | undefined = undefined;
      let paypalOrderId: string | undefined = undefined;
      let isPaymentVerified = false;

      if (paymentMethod !== 'cod') {
        const { paymentIntentId: intentId, paypalOrderId: paypalId } = req.body;
        
        if (paymentMethod === 'paypal') {
          // PayPal payment verification
          if (!paypalId) {
            throw new Error('PayPal Order ID is required for PayPal payments');
          }
          
          // For PayPal, we trust the frontend has already captured the payment
          // In production, you should verify with PayPal API
          // For now, we'll accept the PayPal order ID as proof of payment
          paypalOrderId = paypalId;
          isPaymentVerified = true;
          logger.info(`PayPal payment received: Order ID ${paypalId}`);
        } else {
          // Stripe payment verification (credit_card, apple_pay, google_pay)
          if (!intentId) {
            throw new Error('Payment Intent ID is required for online payment methods');
          }
          
          // Verify payment with Stripe
          if (stripe) {
            try {
              const paymentIntent = await stripe.paymentIntents.retrieve(intentId);
              
              if (paymentIntent.status !== 'succeeded') {
                throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
              }
              
              // Verify amount matches
              const expectedAmount = Math.round(totalPrice * 100);
              if (paymentIntent.amount !== expectedAmount) {
                throw new Error(`Payment amount mismatch. Expected: $${totalPrice}, Got: $${paymentIntent.amount / 100}`);
              }
              
              paymentIntentId = intentId;
              isPaymentVerified = true;
            } catch (stripeError: unknown) {
              logger.error('Payment verification error:', stripeError);
              const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
              throw new Error(`Payment verification failed: ${errorMessage}`);
            }
          } else {
            // Stripe not configured but payment method requires it
            throw new Error('Payment processing not configured. Please use Cash on Delivery (COD) or configure Stripe.');
          }
        }
      } else {
        // COD - no payment verification needed
        isPaymentVerified = true;
      }

      // Step 4: Create order within transaction
      const order = await Order.create([{
        user: req.user._id,
        items: normalizedItems,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentMethod,
        paymentIntentId: paymentIntentId,
        paypalOrderId: paypalOrderId,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : (isPaymentVerified ? 'paid' : 'pending'),
        isPaid: paymentMethod !== 'cod' && isPaymentVerified ? true : false,
        paidAt: paymentMethod !== 'cod' && isPaymentVerified ? new Date() : undefined,
        itemsPrice,
        shippingPrice,
        taxPrice,
        donationAmount: donationAmount || 0,
        totalPrice,
        notes: notes || undefined
      }], session ? { session } : {});

      // Step 5: Commit transaction if using one
      if (session) {
        await session.commitTransaction();
      }
      
      // Normalize order ID before sending response
      const normalizedOrder = normalizeOrderId(order[0]);
      
      // Send order confirmation email (non-blocking - don't fail order if email fails)
      try {
        const user = await User.findById(req.user._id).select('email firstName lastName').lean();
        if (user && user.email) {
          // Fetch the full order with all details for email
          const fullOrder = await Order.findById(normalizedOrder._id).lean();
          
          if (fullOrder && fullOrder.orderNumber) {
            sendOrderConfirmationEmail(
              user.email,
              user.firstName || 'Customer',
              fullOrder.orderNumber,
              {
                items: fullOrder.items.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                  image: item.image
                })),
                totalPrice: fullOrder.totalPrice,
                itemsPrice: fullOrder.itemsPrice,
                shippingPrice: fullOrder.shippingPrice,
                taxPrice: fullOrder.taxPrice,
                donationAmount: fullOrder.donationAmount,
                shippingAddress: fullOrder.shippingAddress,
                paymentMethod: fullOrder.paymentMethod,
                orderStatus: fullOrder.orderStatus,
                createdAt: fullOrder.createdAt
              }
            ).catch((error) => {
              // Log error but don't fail the order creation
              logger.error('Failed to send order confirmation email:', error);
            });
          }
        }
      } catch (emailError) {
        // Log error but don't fail the order creation
        logger.error('Error preparing order confirmation email:', emailError);
      }
      
      if (!normalizedOrder) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create order'
        });
      }
      
      res.status(201).json({
        success: true,
        data: normalizedOrder
      });
    } catch (error: unknown) {
      // Rollback transaction on error if using one
      if (session) {
        await session.abortTransaction();
      }
      
      // Return appropriate error response
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not found') || errorMessage.includes('out of stock') || errorMessage.includes('Insufficient stock')) {
        return res.status(400).json({
          success: false,
          message: errorMessage,
          errors: [errorMessage]
        });
      }
      
      throw error; // Re-throw to be handled by outer catch
    } finally {
      // End session if using one
      if (session) {
        session.endSession();
      }
    }
  } catch (error: unknown) {
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as { errors?: Record<string, { message: string }> };
      const messages = Object.values(validationError.errors || {}).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    next(error);
  }
};

// Helper function to normalize order IDs to strings
const normalizeOrderId = (order: unknown): NormalizedOrder | null => {
  if (!order || typeof order !== 'object') return null;
  
  try {
    // Convert Mongoose document to plain object
    const orderObj = order as Record<string, unknown>;
    let normalized: Partial<NormalizedOrder>;
    if ('toObject' in orderObj && typeof orderObj.toObject === 'function') {
      normalized = orderObj.toObject() as Partial<NormalizedOrder>;
    } else if ('toJSON' in orderObj && typeof orderObj.toJSON === 'function') {
      normalized = orderObj.toJSON() as Partial<NormalizedOrder>;
    } else {
      normalized = { ...orderObj } as Partial<NormalizedOrder>;
    }
    
    // Normalize _id - ensure it's a string
    if (normalized._id) {
      // Handle ObjectId objects properly
      if (normalized._id.toString && typeof normalized._id.toString === 'function') {
        normalized._id = normalized._id.toString();
      } else {
        normalized._id = String(normalized._id);
      }
    }
    
    // Normalize user._id if user is populated
    if (normalized.user && typeof normalized.user === 'object' && normalized.user !== null) {
      if (normalized.user._id) {
        normalized.user._id = String(normalized.user._id);
      }
    }
    
    // Normalize product IDs in items
    if (normalized.items && Array.isArray(normalized.items)) {
      normalized.items = normalized.items.map((item) => {
        if (item && typeof item === 'object') {
          const normalizedItem = { ...item };
          if (normalizedItem.product && typeof normalizedItem.product === 'object' && normalizedItem.product !== null) {
            if (normalizedItem.product._id) {
              normalizedItem.product = String(normalizedItem.product._id);
            }
          }
          return normalizedItem;
        }
        return item;
      });
    }
    
    return normalized as NormalizedOrder;
  } catch (error) {
    // Error normalizing order
    // Return null if normalization fails
    return null;
  }
};

// Helper function to normalize array of orders
const normalizeOrders = (orders: unknown[]): NormalizedOrder[] => {
  if (!Array.isArray(orders)) {
    return [];
  }
  return orders.map((order) => {
    try {
      const normalized = normalizeOrderId(order);
      // Double-check _id is a string
      if (normalized && normalized._id && typeof normalized._id !== 'string') {
        normalized._id = normalized._id.toString ? normalized._id.toString() : String(normalized._id);
      }
      return normalized;
    } catch (error) {
      // Error normalizing order in array
      return order;
    }
  }).filter((order): order is NormalizedOrder => order !== null && order !== undefined);
};

/**
 * @swagger
 * /api/orders/myorders:
 *   get:
 *     summary: Get current user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of user orders
 *       401:
 *         description: Not authenticated
 */
// Get user orders
export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Validate user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() to get plain JavaScript objects instead of Mongoose documents

    const total = await Order.countDocuments({ user: req.user._id });

    // Normalize order IDs to strings - ensure _id is always a string
    const normalizedOrders = orders.map((order) => {
      // Force _id to be a string
      const orderObj = order as Record<string, unknown>;
      if (orderObj._id) {
        // Handle ObjectId with buffer or other formats
        const idObj = orderObj._id as { toString?: () => string; buffer?: { data?: number[] } };
        if (idObj.toString && typeof idObj.toString === 'function') {
          orderObj._id = idObj.toString();
        } else if (idObj.buffer && idObj.buffer.data && Array.isArray(idObj.buffer.data)) {
          // If it has a buffer, try to extract from it
          try {
            orderObj._id = idObj.buffer.data
              .map((b: number) => b.toString(16).padStart(2, '0'))
              .join('');
          } catch (e) {
            orderObj._id = String(orderObj._id);
          }
        } else {
          orderObj._id = String(orderObj._id);
        }
      }
      return normalizeOrderId(orderObj);
    }).filter((order): order is NormalizedOrder => order !== null && order !== undefined);

    res.status(200).json({
      success: true,
      data: normalizedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: unknown) {
    // Error in getMyOrders
    next(error);
  }
};

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view this order
 *       404:
 *         description: Order not found
 */
// Get single order
export const getOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validate user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate order ID format
    const orderId = String(req.params.id).trim();
    
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // For frontend customers, always filter by user ID (same as getMyOrders)
    // Only admins (from dashboard) can view any order
    // Use the same approach as getMyOrders - query with user filter
    // This ensures Mongoose handles ObjectId comparison correctly
    let order;
    
    if (req.user.role === 'admin' || req.user.role === 'staff') {
      // Admin/Staff from dashboard can view any order
      order = await Order.findById(orderId).populate('user', 'firstName lastName email').lean();
    } else {
      // Frontend customers can only view their own orders - use same filter as getMyOrders
      // This is the same query pattern that works in getMyOrders
      order = await Order.findOne({ 
        _id: orderId,
        user: req.user._id  // Mongoose will handle ObjectId comparison automatically
      }).populate('user', 'firstName lastName email').lean();
    }
    
    if (!order) {
      // Check if order exists at all (for better error message)
      const orderExists = await Order.findById(orderId);
      if (!orderExists) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      } else {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this order'
        });
      }
    }
    
    if (!order) {
      // This shouldn't happen since we already checked, but just in case
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Normalize order ID to string
    const normalizedOrder = normalizeOrderId(order);

    res.status(200).json({
      success: true,
      data: normalizedOrder
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * @swagger
 * /api/orders/all:
 *   get:
 *     summary: Get all orders (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: List of all orders
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 */
// Get all orders (Admin)
export const getAllOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    // Filter by status
    if (req.query.status) {
      query.orderStatus = req.query.status;
    }

    // Filter by payment status
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() to get plain JavaScript objects

    const total = await Order.countDocuments(query);

    // Normalize order IDs to strings
    const normalizedOrders = orders.map((order) => normalizeOrderId(order));

    res.status(200).json({
      success: true,
      data: normalizedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderStatus:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *               trackingNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       404:
 *         description: Order not found
 */
// Update order status (Admin)
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderStatus, trackingNumber } = req.body;

    // Validate orderStatus if provided
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (orderStatus && !validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status if provided
    if (orderStatus) {
      order.orderStatus = orderStatus;
    }
    
    // Update tracking number if provided
    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber || null;
    }

    // Handle delivered status
    const wasDelivered = order.isDelivered;
    if (orderStatus === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    } else if (orderStatus && orderStatus !== 'delivered') {
      // If changing from delivered to another status, reset delivered flags
      if (order.isDelivered) {
        order.isDelivered = false;
        order.deliveredAt = undefined;
      }
    }

    await order.save();

    // Send delivery email if order was just marked as delivered
    if (orderStatus === 'delivered' && !wasDelivered) {
      try {
        const user = await User.findById(order.user).select('email firstName lastName').lean();
        if (user && user.email) {
          const fullOrder = await Order.findById(order._id).lean();
          if (fullOrder && fullOrder.orderNumber) {
            sendOrderDeliveredEmail(
              user.email,
              user.firstName || 'Customer',
              fullOrder.orderNumber,
              {
                items: fullOrder.items.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                  image: item.image
                })),
                totalPrice: fullOrder.totalPrice,
                trackingNumber: fullOrder.trackingNumber,
                deliveredAt: fullOrder.deliveredAt || new Date(),
                shippingAddress: fullOrder.shippingAddress
              }
            ).catch((error) => {
              logger.error('Failed to send order delivered email:', error);
            });
          }
        }
      } catch (emailError) {
        logger.error('Error preparing order delivered email:', emailError);
      }
    }

    const normalizedOrder = normalizeOrderId(order);
    
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: normalizedOrder
    });
  } catch (error: unknown) {
    // Handle Mongoose validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as { errors?: Record<string, { message: string }> };
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(validationError.errors || {}).map((err) => err.message)
      });
    }
    next(error);
  }
};

/**
 * @swagger
 * /api/orders/{id}/payment:
 *   put:
 *     summary: Update payment status (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed, refunded]
 *     responses:
 *       200:
 *         description: Payment status updated
 *       400:
 *         description: Invalid payment status
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       404:
 *         description: Order not found
 */
// Update payment status (Admin)
export const updatePaymentStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.paymentStatus = paymentStatus;

    if (paymentStatus === 'paid') {
      order.isPaid = true;
      order.paidAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancel order (Customer)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Cannot cancel order (time window expired or invalid status)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to cancel this order
 *       404:
 *         description: Order not found
 */
// Cancel order (Customer) - Enhanced with time window
export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    
    // Validate and extract order ID
    const orderId = extractObjectId(req.params.id);
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
        errors: [{ field: 'id', message: 'Invalid ID format' }]
      });
    }
    
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Make sure user can only cancel their own orders
    const userId = extractObjectId(req.user?._id);
    const orderUserId = extractObjectId(order.user);
    
    if (!userId || !orderUserId || !userId.equals(orderUserId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    const cancellationWindowHours = 24; // Allow cancellation within 24 hours
    const hoursSinceOrder = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60);
    const canCancelByTime = hoursSinceOrder <= cancellationWindowHours;
    const canCancelByStatus = ['pending', 'processing'].includes(order.orderStatus);
    const cannotCancelStatuses = ['shipped', 'delivered', 'cancelled'];

    if (cannotCancelStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order. Order is already ${order.orderStatus}.`,
        canCancel: false
      });
    }

    // Check time window for both pending and processing orders
    if (!canCancelByTime && canCancelByStatus) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order. Cancellation window (${cancellationWindowHours} hours) has expired. Please contact customer service for assistance.`,
        canCancel: false,
        hoursSinceOrder: Math.round(hoursSinceOrder * 10) / 10
      });
    }

    if (!canCancelByStatus) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order. Order status is ${order.orderStatus}.`,
        canCancel: false
      });
    }

    // Use transaction to ensure atomicity
    // Skip transactions in test mode (standalone MongoDB doesn't support transactions)
    const useTransactions = process.env.NODE_ENV !== 'test';
    let session: mongoose.ClientSession | null = null;
    
    if (useTransactions) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (error) {
        // If transaction fails (e.g., not a replica set), continue without transaction
        session = null;
      }
    }

    try {
      // Update order status to cancelled
      order.orderStatus = 'cancelled';
      if (reason) {
        order.notes = order.notes ? `${order.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
      }
      await order.save(session ? { session } : {});

      // Restore product stock
      for (const item of order.items) {
        const product = session ? await Product.findById(item.product).session(session) : await Product.findById(item.product);
        if (product) {
          product.totalStock += item.quantity;
          product.inStock = product.totalStock > 0;
          await product.save(session ? { session } : {});
        }
      }

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      const normalizedOrder = normalizeOrderId(order);
      
      // Send cancellation email (non-blocking)
      try {
        const user = await User.findById(order.user).select('email firstName lastName').lean();
        if (user && user.email) {
          const fullOrder = await Order.findById(order._id).lean();
          if (fullOrder && fullOrder.orderNumber) {
            sendOrderCancellationEmail(
              user.email,
              user.firstName || 'Customer',
              fullOrder.orderNumber,
              {
                items: fullOrder.items.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                  image: item.image
                })),
                totalPrice: fullOrder.totalPrice,
                cancellationReason: reason || 'Customer request',
                refundAmount: fullOrder.totalPrice, // Full refund for cancelled orders
                createdAt: fullOrder.createdAt
              }
            ).catch((error) => {
              logger.error('Failed to send order cancellation email:', error);
            });
          }
        }
      } catch (emailError) {
        logger.error('Error preparing order cancellation email:', emailError);
      }

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: normalizedOrder,
        refundInfo: order.isPaid ? {
          willRefund: true,
          refundAmount: order.totalPrice,
          refundMethod: 'original',
          estimatedTime: '5-7 business days'
        } : null
      });
    } catch (error: any) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          // Ignore abort errors
        }
        try {
          session.endSession();
        } catch (endError) {
          // Ignore end session errors
        }
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/orders/stats:
 *   get:
 *     summary: Get order statistics (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 */
// Get order stats (Admin)
export const getOrderStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const processingOrders = await Order.countDocuments({ orderStatus: 'processing' });
    const shippedOrders = await Order.countDocuments({ orderStatus: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });

    // Calculate total revenue
    const paidOrders = await Order.find({ paymentStatus: 'paid' })
      .select('totalPrice donationAmount')
      .lean();
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    // Calculate donation statistics
    const ordersWithDonations = await Order.find({ donationAmount: { $gt: 0 } })
      .lean();
    const totalDonations = ordersWithDonations.reduce((sum, order) => sum + (order.donationAmount || 0), 0);
    const donationCount = ordersWithDonations.length;
    const averageDonation = donationCount > 0 ? totalDonations / donationCount : 0;

    // Monthly donation breakdown (last 12 months)
    const monthlyDonations = await Order.aggregate([
      {
        $match: {
          donationAmount: { $gt: 0 },
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$donationAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        totalRevenue,
        totalDonations,
        donationCount,
        averageDonation,
        monthlyDonations,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// Track order by ID (Public - no authentication required)
/**
 * @swagger
 * /api/orders/track/{id}:
 *   get:
 *     summary: Track order by ID (Public)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order tracking information
 *       404:
 *         description: Order not found
 */
export const trackOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(id)
      .populate('user', 'firstName lastName email')
      .select('-billingAddress'); // Don't expose billing address

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Return limited order info for tracking (public)
    const trackingInfo = {
      _id: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      shippingAddress: {
        firstName: order.shippingAddress.firstName,
        lastName: order.shippingAddress.lastName,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zipCode: order.shippingAddress.zipCode
      },
      itemsPrice: order.itemsPrice,
      shippingPrice: order.shippingPrice,
      taxPrice: order.taxPrice,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      isDelivered: order.isDelivered,
      deliveredAt: order.deliveredAt
    };

    res.status(200).json({
      success: true,
      data: trackingInfo
    });
  } catch (error) {
    next(error);
  }
};

// Create payment intent for order
export const createOrderPaymentIntent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { totalPrice, paymentMethod, shippingAddress } = req.body;

    // Validate total price
    if (!totalPrice || totalPrice < 0.5) {
      return res.status(400).json({
        success: false,
        message: 'Order total must be at least $0.50'
      });
    }

    // Validate payment method
    const validMethods = ['credit_card', 'paypal', 'apple_pay', 'google_pay'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Use credit_card, paypal, apple_pay, or google_pay'
      });
    }

    // Check if Stripe is configured
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment processing not configured. Please set STRIPE_SECRET_KEY in environment variables.'
      });
    }

    // Create Stripe Payment Intent
    const amountInCents = Math.round(totalPrice * 100);

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        payment_method_types: paymentMethod === 'credit_card' 
          ? ['card'] 
          : paymentMethod === 'apple_pay' 
          ? ['card', 'apple_pay'] 
          : paymentMethod === 'google_pay'
          ? ['card', 'google_pay']
          : ['card'],
        metadata: {
          order: 'true',
          userId: String(req.user?._id || ''),
          userEmail: req.user?.email || '',
          userName: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim()
        }
      });

      res.status(200).json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        }
      });
    } catch (stripeError: unknown) {
      logger.error('Stripe error:', stripeError);
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Payment processing error: ' + errorMessage
      });
    }
  } catch (error: unknown) {
    logger.error('Payment intent error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// Confirm order payment (verify payment before creating order)
export const confirmOrderPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required'
      });
    }

    // Verify payment with Stripe
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment processing not configured.'
      });
    }
    
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        return res.status(200).json({
          success: true,
          message: 'Payment confirmed successfully',
          data: {
            paymentStatus: 'paid',
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100 // Convert from cents
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Payment not completed',
          data: {
            paymentStatus: paymentIntent.status
          }
        });
      }
    } catch (stripeError: unknown) {
      logger.error('Stripe verification error:', stripeError);
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Payment verification failed: ' + errorMessage
      });
    }
  } catch (error: unknown) {
    logger.error('Payment confirmation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to confirm payment';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};




import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { safeToString, extractObjectId } from '../utils/types';
import { asyncHandler, NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors';

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
    const normalizedItems = items.map((item: any) => {
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
    const session = await mongoose.startSession();
    session.startTransaction();

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
        
        // Find product with lock (within transaction)
        const product = await Product.findById(productId).session(session);
        
        if (!product) {
          throw new Error(`Product ${item.name || productId} not found`);
        }
        
        if (!product.inStock) {
          throw new Error(`Product "${item.name}" is currently out of stock`);
        }

        // Handle variant stock if item has a variant SKU
        if (item.variant && item.variant.sku) {
          const variant = product.variants.find((v: any) => v.sku === item.variant.sku);
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
            { session }
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
            { session }
          );

          if (productUpdateResult.matchedCount === 0) {
            const product = await Product.findById(update.productId).session(session);
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
          { session }
        );
      }

      // Step 3: Create order within transaction
      const order = await Order.create([{
        user: req.user._id,
        items: normalizedItems,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        donationAmount: donationAmount || 0,
        totalPrice,
        notes: notes || undefined
      }], { session });

      // Step 4: Commit transaction
      await session.commitTransaction();
      
      res.status(201).json({
        success: true,
        data: order[0]
      });
    } catch (error: any) {
      // Rollback transaction on error
      await session.abortTransaction();
      
      // Return appropriate error response
      if (error.message.includes('not found') || error.message.includes('out of stock') || error.message.includes('Insufficient stock')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: [error.message]
        });
      }
      
      throw error; // Re-throw to be handled by outer catch
    } finally {
      // End session
      session.endSession();
    }
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
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
const normalizeOrderId = (order: any): any => {
  if (!order) return order;
  
  try {
    // Convert Mongoose document to plain object
    let normalized: any;
    if (order.toObject && typeof order.toObject === 'function') {
      normalized = order.toObject();
    } else if (order.toJSON && typeof order.toJSON === 'function') {
      normalized = order.toJSON();
    } else {
      normalized = { ...order };
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
      normalized.items = normalized.items.map((item: any) => {
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
    
    return normalized;
  } catch (error) {
    // Error normalizing order
    // Return original order if normalization fails
    return order;
  }
};

// Helper function to normalize array of orders
const normalizeOrders = (orders: any[]): any[] => {
  if (!Array.isArray(orders)) {
    return [];
  }
  return orders.map((order: any) => {
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
  }).filter((order: any) => order !== null && order !== undefined);
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
    const normalizedOrders = orders.map((order: any) => {
      // Force _id to be a string
      if (order._id) {
        // Handle ObjectId with buffer or other formats
        if (order._id.toString && typeof order._id.toString === 'function') {
          order._id = order._id.toString();
        } else if (order._id.buffer) {
          // If it has a buffer, try to extract from it
          try {
            if (order._id.buffer.data && Array.isArray(order._id.buffer.data)) {
              order._id = order._id.buffer.data
                .map((b: number) => b.toString(16).padStart(2, '0'))
                .join('');
            }
          } catch (e) {
            order._id = String(order._id);
          }
        } else {
          order._id = String(order._id);
        }
      }
      return normalizeOrderId(order);
    }).filter((order: any) => order !== null && order !== undefined);

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
  } catch (error: any) {
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
  } catch (error: any) {
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

    const query: any = {};

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
    const normalizedOrders = orders.map((order: any) => normalizeOrderId(order));

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

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error: any) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map((err: any) => err.message)
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
    const order = await Order.findById(req.params.id);

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

    if (!canCancelByTime && order.orderStatus === 'processing') {
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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update order status to cancelled
      order.orderStatus = 'cancelled';
      if (reason) {
        order.notes = order.notes ? `${order.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
      }
      await order.save({ session });

      // Restore product stock
      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          product.totalStock += item.quantity;
          product.inStock = product.totalStock > 0;
          await product.save({ session });
        }
      }

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: order,
        refundInfo: order.isPaid ? {
          willRefund: true,
          refundAmount: order.totalPrice,
          refundMethod: 'original',
          estimatedTime: '5-7 business days'
        } : null
      });
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
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
    const paidOrders = await Order.find({ paymentStatus: 'paid' });
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    // Calculate donation statistics
    const ordersWithDonations = await Order.find({ donationAmount: { $gt: 0 } });
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
      .limit(5);

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




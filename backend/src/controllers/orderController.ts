import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { safeToString, extractObjectId } from '../utils/types';
import { asyncHandler, NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors';
import { sendOrderConfirmationEmail, sendOrderCancellationEmail, sendOrderDeliveredEmail, sendAdminNewOrderEmail } from '../utils/emailService';
import logger from '../utils/logger';
import { executeCachedAggregation } from '../utils/aggregationCache';
import { addEmailJob } from '../utils/jobQueue';
import { cache } from '../utils/cache';

import type { OrderItemInput, NormalizedOrderItem, NormalizedOrder } from '../types/common';
import Stripe from 'stripe';

const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' as any })
  : null;

// Create new order — supports both authenticated users and guests
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
      notes,
      guestEmail // GUEST CHECKOUT: email from guest user
    } = req.body;

    // GUEST CHECKOUT: user is optional
    const isGuest = !req.user?._id;
    const customerEmail = isGuest
      ? (guestEmail || shippingAddress?.email || '').trim()
      : null;

    // Guests must provide an email
    if (isGuest && !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address to receive your order confirmation'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is incomplete',
        errors: ['Street, city, state, and zip code are required']
      });
    }
    if (!shippingAddress.firstName?.trim() || !shippingAddress.lastName?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your first and last name for delivery',
        errors: ['First name and last name are required for shipping']
      });
    }
    if (!shippingAddress.phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a phone number for delivery contact',
        errors: ['Phone number is required for delivery']
      });
    }

    const normalizedItems = items.map((item: OrderItemInput): NormalizedOrderItem => {
      let productId: string | null = null;
      const rawProductId = item.product;
      if (!rawProductId) {
        throw new Error(`Product ID is missing for item: ${item.name || 'Unknown'}`);
      }
      productId = safeToString(rawProductId);
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error(`Invalid product ID for item: ${item.name || 'Unknown'}`);
      }
      return { ...item, product: productId };
    });

    const useTransactions = process.env.NODE_ENV !== 'test';
    let session: mongoose.ClientSession | null = null;
    if (useTransactions) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('replica set')) {
          session = null;
        } else {
          throw error;
        }
      }
    }

    try {
      const stockUpdates: Array<{ productId: string; quantity: number; variantSku?: string }> = [];

      for (const item of normalizedItems) {
        const productId = item.product;
        const quantity = item.quantity || 1;
        const product = session ? await Product.findById(productId).session(session) : await Product.findById(productId);
        if (!product) throw new Error(`Product ${item.name || productId} not found`);
        if (!product.inStock) throw new Error(`Product "${item.name}" is currently out of stock`);

        if (item.variant && item.variant.sku) {
          const decodeSku = (s: string) => s
            .replace(/&amp;amp;/g, '&')
            .replace(/&amp;/g, '&')
            .replace(/&#039;/g, "'")
            .replace(/&quot;/g, '"');
          const normalizedCartSku = decodeSku(item.variant.sku);
          const variant = product.variants.find((v) =>
            v.sku === item.variant?.sku ||
            v.sku === normalizedCartSku ||
            decodeSku(v.sku || '') === normalizedCartSku
          );
          if (!variant) {
            if (product.totalStock < quantity) {
              throw new Error(`Insufficient stock for product "${item.name}". Available: ${product.totalStock}, Requested: ${quantity}`);
            }
            stockUpdates.push({ productId, quantity });
          } else {
            if (variant.stock < quantity) {
              throw new Error(`Insufficient stock for variant "${item.variant.sku}" of product "${item.name}". Available: ${variant.stock}, Requested: ${quantity}`);
            }
            stockUpdates.push({ productId, quantity, variantSku: variant.sku });
          }
        } else {
          if (product.totalStock < quantity) {
            throw new Error(`Insufficient stock for product "${item.name}". Available: ${product.totalStock}, Requested: ${quantity}`);
          }
          stockUpdates.push({ productId, quantity });
        }
      }

      for (const update of stockUpdates) {
        if (update.variantSku) {
          const variantUpdateResult = await Product.updateOne(
            { _id: update.productId, 'variants.sku': update.variantSku, 'variants.stock': { $gte: update.quantity } },
            { $inc: { 'variants.$.stock': -update.quantity, totalStock: -update.quantity } },
            session ? { session } : {}
          );
          if (variantUpdateResult.matchedCount === 0) {
            throw new Error(`Insufficient stock for variant SKU "${update.variantSku}"`);
          }
        } else {
          const productUpdateResult = await Product.updateOne(
            { _id: update.productId, totalStock: { $gte: update.quantity } },
            { $inc: { totalStock: -update.quantity } },
            session ? { session } : {}
          );
          if (productUpdateResult.matchedCount === 0) {
            const product = session ? await Product.findById(update.productId).session(session) : await Product.findById(update.productId);
            throw new Error(`Insufficient stock for product. Available: ${product?.totalStock || 0}, Requested: ${update.quantity}`);
          }
        }
        await Product.updateOne(
          { _id: update.productId },
          [{ $set: { inStock: { $gt: ['$totalStock', 0] } } }],
          session ? { session } : {}
        );
      }

      let paymentIntentId: string | undefined = undefined;
      let paypalOrderId: string | undefined = undefined;
      let isPaymentVerified = false;

      if (paymentMethod !== 'cod') {
        const { paymentIntentId: intentId, paypalOrderId: paypalId } = req.body;
        if (paymentMethod === 'paypal') {
          if (!paypalId) throw new Error('PayPal Order ID is required for PayPal payments');
          paypalOrderId = paypalId;
          isPaymentVerified = true;
          logger.info(`PayPal payment received: Order ID ${paypalId}`);
        } else {
          if (!intentId) throw new Error('Payment Intent ID is required for online payment methods');
          if (stripe) {
            try {
              const paymentIntent = await stripe.paymentIntents.retrieve(intentId);
              if (paymentIntent.status !== 'succeeded') {
                throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
              }
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
            throw new Error('Payment processing not configured. Please use Cash on Delivery (COD) or configure Stripe.');
          }
        }
      } else {
        isPaymentVerified = true;
      }

      // GUEST CHECKOUT: user field is optional
      const newOrder = new Order({
        ...(req.user?._id ? { user: req.user._id } : {}),
        ...(isGuest ? { guestEmail: customerEmail } : {}),
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
      });
      const savedOrder = await newOrder.save(session ? { session } : {});
      const order = [savedOrder];

      if (session) {
        await session.commitTransaction();
      }

      let normalizedOrder = normalizeOrderId(order[0]);

      if (!normalizedOrder && order[0]) {
        logger.warn(`normalizeOrderId returned null for order ${order[0]._id} — using direct fallback`);
        try {
          const doc = order[0];
          normalizedOrder = {
            _id: String(doc._id),
            orderNumber: doc.orderNumber || '',
            user: doc.user ? String(doc.user) : undefined,
            items: (doc.items || []).map((item) => ({
              ...item,
              product: String(item.product),
            })) as NormalizedOrderItem[],
            shippingAddress: doc.shippingAddress as unknown as Record<string, unknown>,
            paymentMethod: doc.paymentMethod,
            paymentStatus: doc.paymentStatus,
            orderStatus: doc.orderStatus,
            itemsPrice: doc.itemsPrice,
            shippingPrice: doc.shippingPrice,
            taxPrice: doc.taxPrice,
            totalPrice: doc.totalPrice,
            createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: (doc as any).updatedAt ? (doc as any).updatedAt.toISOString() : new Date().toISOString(),
          } as NormalizedOrder;
        } catch (fallbackErr) {
          logger.error(`Fallback normalization also failed: ${fallbackErr}`);
        }
      }

      if (!normalizedOrder) {
        logger.error(`Order created (id=${order[0]?._id}) but normalization failed completely`);
        return res.status(500).json({
          success: false,
          message: 'Order was placed but we had a technical issue fetching the details. Please check your email and order history.'
        });
      }

      // Real-time notification (non-blocking)
      try {
        const { notifyNewOrder } = await import('../utils/orderNotifications');
        const fullOrder = await Order.findById(normalizedOrder._id)
          .populate('user', 'firstName lastName email')
          .lean();
        if (fullOrder) {
          notifyNewOrder(fullOrder);
        }
      } catch (notificationError) {
        logger.error('Error sending order notification:', notificationError);
      }

      // Send confirmation email — works for both logged-in and guest users
      try {
        let emailAddress: string | undefined;
        let firstName: string = 'Customer';

        if (isGuest) {
          emailAddress = customerEmail || undefined;
          firstName = shippingAddress.firstName || 'Customer';
        } else {
          const userDoc = await User.findById(req.user!._id).select('email firstName lastName').lean();
          emailAddress = userDoc?.email;
          firstName = userDoc?.firstName || 'Customer';
        }

        if (emailAddress) {
          const fullOrder = await Order.findById(normalizedOrder._id).lean();
          if (fullOrder && fullOrder.orderNumber) {
            const orderIdStr = String(fullOrder._id);
            await addEmailJob(
              'order-confirmation',
              {
                email: emailAddress,
                firstName,
                orderNumber: fullOrder.orderNumber,
                orderData: {
                  orderId: orderIdStr,
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
              },
              async () => {
                await sendOrderConfirmationEmail(
                  emailAddress!,
                  firstName,
                  fullOrder.orderNumber,
                  {
                    orderId: orderIdStr,
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
                );
              }
            );
          }
        }
      } catch (emailError) {
        logger.error('Error queuing order confirmation email:', emailError);
      }

      // Admin notification (fire-and-forget)
      try {
        let adminCustomerEmail = '';
        let adminFirstName = shippingAddress.firstName || 'Guest';
        let adminLastName = shippingAddress.lastName || '';

        if (!isGuest && req.user?._id) {
          const userDoc = await User.findById(req.user._id).select('email firstName lastName').lean();
          adminCustomerEmail = userDoc?.email || '';
          adminFirstName = userDoc?.firstName || adminFirstName;
          adminLastName = userDoc?.lastName || adminLastName;
        } else {
          adminCustomerEmail = customerEmail || '';
        }

        const fullOrderForAdmin = await Order.findById(normalizedOrder._id).lean();
        if (fullOrderForAdmin) {
          sendAdminNewOrderEmail({
            orderNumber: fullOrderForAdmin.orderNumber,
            orderId: String(fullOrderForAdmin._id),
            customerFirstName: adminFirstName,
            customerLastName: adminLastName,
            customerEmail: adminCustomerEmail,
            items: fullOrderForAdmin.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            totalPrice: fullOrderForAdmin.totalPrice,
            itemsPrice: fullOrderForAdmin.itemsPrice,
            shippingPrice: fullOrderForAdmin.shippingPrice,
            taxPrice: fullOrderForAdmin.taxPrice,
            paymentMethod: fullOrderForAdmin.paymentMethod,
            shippingAddress: fullOrderForAdmin.shippingAddress
          }).catch((err) => logger.error('Admin notification email failed silently:', err));
        }
      } catch (adminEmailError) {
        logger.error('Error sending admin order notification:', adminEmailError);
      }

      res.status(201).json({ success: true, data: normalizedOrder });

    } catch (error: unknown) {
      if (session) {
        await session.abortTransaction();
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not found') || errorMessage.includes('out of stock') || errorMessage.includes('Insufficient stock')) {
        return res.status(400).json({ success: false, message: errorMessage });
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as { errors?: Record<string, { message: string }> };
      const messages = Object.values(validationError.errors || {}).map((err) => err.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
    }
    next(error);
  }
};

// Helper function to normalize order IDs to strings
const normalizeOrderId = (order: unknown): NormalizedOrder | null => {
  if (!order || typeof order !== 'object') return null;
  try {
    const orderObj = order as Record<string, unknown>;
    let normalized: Record<string, unknown>;
    if ('toObject' in orderObj && typeof orderObj.toObject === 'function') {
      normalized = orderObj.toObject() as Record<string, unknown>;
    } else if ('toJSON' in orderObj && typeof orderObj.toJSON === 'function') {
      normalized = orderObj.toJSON() as Record<string, unknown>;
    } else {
      normalized = { ...orderObj };
    }
    if (normalized._id) {
      const idValue = normalized._id as { toString?: () => string } | string | number;
      if (typeof idValue === 'object' && idValue !== null && 'toString' in idValue && typeof idValue.toString === 'function') {
        normalized._id = idValue.toString();
      } else {
        normalized._id = String(normalized._id);
      }
    }
    if (normalized.user && typeof normalized.user === 'object' && normalized.user !== null) {
      const userObj = normalized.user as Record<string, unknown>;
      if (userObj._id) {
        userObj._id = String(userObj._id);
      }
    }
    if (normalized.items && Array.isArray(normalized.items)) {
      normalized.items = (normalized.items || []).map((item: unknown) => {
        if (item && typeof item === 'object') {
          const normalizedItem = { ...(item as Record<string, unknown>) };
          if (normalizedItem.product && typeof normalizedItem.product === 'object' && normalizedItem.product !== null) {
            const productObj = normalizedItem.product as Record<string, unknown>;
            if (productObj._id) {
              normalizedItem.product = String(productObj._id);
            }
          }
          return normalizedItem;
        }
        return item;
      });
    }
    return normalized as NormalizedOrder;
  } catch (error) {
    logger.error(`normalizeOrderId internal error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};

const normalizeOrders = (orders: unknown[]): NormalizedOrder[] => {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => {
    try {
      const normalized = normalizeOrderId(order);
      if (normalized && normalized._id && typeof normalized._id !== 'string') {
        const idValue = normalized._id as { toString?: () => string } | string | number;
        if (typeof idValue === 'object' && idValue !== null && 'toString' in idValue && typeof idValue.toString === 'function') {
          normalized._id = idValue.toString();
        } else {
          normalized._id = String(normalized._id);
        }
      }
      return normalized;
    } catch (error) {
      return order;
    }
  }).filter((order): order is NormalizedOrder => order !== null && order !== undefined);
};

export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments({ user: req.user._id });

    const normalizedOrders = orders.map((order) => {
      const orderObj = order as Record<string, unknown>;
      if (orderObj._id) {
        const idObj = orderObj._id as { toString?: () => string; buffer?: { data?: number[] } };
        if (idObj.toString && typeof idObj.toString === 'function') {
          orderObj._id = idObj.toString();
        } else if (idObj.buffer && idObj.buffer.data && Array.isArray(idObj.buffer.data)) {
          try {
            orderObj._id = idObj.buffer.data.map((b: number) => b.toString(16).padStart(2, '0')).join('');
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
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const orderId = String(req.params.id).trim();
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }

    let order;
    if (req.user.role === 'admin' || req.user.role === 'staff') {
      order = await Order.findById(orderId).populate('user', 'firstName lastName email').lean();
    } else {
      order = await Order.findOne({ _id: orderId, user: req.user._id }).populate('user', 'firstName lastName email').lean();
    }

    if (!order) {
      const orderExists = await Order.findById(orderId);
      if (!orderExists) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      } else {
        return res.status(403).json({ success: false, message: 'Not authorized to access this order' });
      }
    }

    const normalizedOrder = normalizeOrderId(order);
    res.status(200).json({ success: true, data: normalizedOrder });
  } catch (error: unknown) {
    next(error);
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const matchQuery: Record<string, unknown> = {};
    if (req.query.status) matchQuery.orderStatus = req.query.status;
    if (req.query.paymentStatus) matchQuery.paymentStatus = req.query.paymentStatus;

    const aggregationPipeline: mongoose.PipelineStage[] = [
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
          pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }]
        }
      },
      { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1, orderNumber: 1,
          user: { firstName: '$userData.firstName', lastName: '$userData.lastName', email: '$userData.email' },
          items: 1, totalPrice: 1, orderStatus: 1, paymentStatus: 1,
          shippingAddress: 1, billingAddress: 1, createdAt: 1, updatedAt: 1,
          donationAmount: 1, trackingNumber: 1
        }
      }
    ];

    const [orders, total] = await Promise.all([
      Order.aggregate(aggregationPipeline as any, { allowDiskUse: true }),
      Order.countDocuments(matchQuery).maxTimeMS(5000)
    ]);

    const normalizedOrders = orders.map((order) => normalizeOrderId(order));
    res.status(200).json({
      success: true,
      data: normalizedOrders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderStatus, trackingNumber } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (orderStatus && !validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (orderStatus) order.orderStatus = orderStatus;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber || null;

    const wasDelivered = order.isDelivered;
    if (orderStatus === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    } else if (orderStatus && orderStatus !== 'delivered') {
      if (order.isDelivered) {
        order.isDelivered = false;
        order.deliveredAt = undefined;
      }
    }

    await order.save();

    if (orderStatus === 'delivered' && !wasDelivered) {
      try {
        const user = await User.findById(order.user).select('email firstName lastName').lean();
        if (user && user.email) {
          const fullOrder = await Order.findById(order._id).lean();
          if (fullOrder && fullOrder.orderNumber) {
            await addEmailJob(
              'order-delivered',
              {
                email: user.email,
                firstName: user.firstName || 'Customer',
                orderNumber: fullOrder.orderNumber,
                orderData: {
                  items: fullOrder.items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price, image: item.image })),
                  totalPrice: fullOrder.totalPrice,
                  trackingNumber: fullOrder.trackingNumber,
                  deliveredAt: fullOrder.deliveredAt || new Date(),
                  shippingAddress: fullOrder.shippingAddress
                }
              },
              async () => {
                await sendOrderDeliveredEmail(
                  user.email,
                  user.firstName || 'Customer',
                  fullOrder.orderNumber,
                  {
                    items: fullOrder.items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price, image: item.image })),
                    totalPrice: fullOrder.totalPrice,
                    trackingNumber: fullOrder.trackingNumber,
                    deliveredAt: fullOrder.deliveredAt || new Date(),
                    shippingAddress: fullOrder.shippingAddress
                  }
                );
              }
            );
          }
        }
      } catch (emailError) {
        logger.error('Error queuing order delivered email:', emailError);
      }
    }

    const normalizedOrder = normalizeOrderId(order);

    try {
      const { notifyOrderUpdate } = await import('../utils/orderNotifications');
      notifyOrderUpdate(order, 'status');
    } catch (notificationError) {
      logger.error('Error sending order update notification:', notificationError);
    }

    res.status(200).json({ success: true, message: 'Order status updated successfully', data: normalizedOrder });
  } catch (error: unknown) {
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

export const updatePaymentStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid') {
      order.isPaid = true;
      order.paidAt = new Date();
    }
    await order.save();

    try {
      const { notifyOrderUpdate } = await import('../utils/orderNotifications');
      notifyOrderUpdate(order, 'payment');
    } catch (notificationError) {
      logger.error('Error sending order update notification:', notificationError);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const processRefund = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount, reason } = req.body;
    const orderId = extractObjectId(req.params.id);

    if (!orderId) return res.status(400).json({ success: false, message: 'Invalid order ID' });
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Refund amount must be greater than 0' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: order.paymentStatus === 'refunded' ? 'Order has already been refunded' : 'Only paid orders can be refunded'
      });
    }
    if (amount > order.totalPrice) return res.status(400).json({ success: false, message: 'Refund amount cannot exceed order total' });

    let refundId: string | null = null;
    let refundStatus = 'pending';

    if (order.paymentIntentId && stripe) {
      try {
        const refundAmountCents = Math.round(amount * 100);
        const refundParams: any = {
          payment_intent: order.paymentIntentId,
          amount: refundAmountCents,
          reason: reason ? 'requested_by_customer' : undefined
        };
        if (order._id && typeof order._id === 'object' && 'toString' in order._id) {
          refundParams.metadata = { orderId: String(order._id), orderNumber: order.orderNumber || '', reason: reason || 'No reason provided' };
        }
        const refund = await stripe.refunds.create(refundParams);
        refundId = refund.id;
        refundStatus = refund.status === 'succeeded' ? 'refunded' : 'pending';
        logger.info(`Stripe refund processed: ${refund.id} for order ${order.orderNumber}`);
      } catch (stripeError: any) {
        logger.error('Stripe refund error:', stripeError);
        return res.status(500).json({ success: false, message: `Failed to process refund: ${stripeError.message || 'Payment gateway error'}` });
      }
    } else if (order.paypalOrderId) {
      logger.info(`PayPal refund requested for order ${order.orderNumber}: Amount $${amount}, PayPal Order ID: ${order.paypalOrderId}`);
      refundStatus = 'pending';
      refundId = `MANUAL-${Date.now()}`;
    } else if (order.paymentMethod === 'cod') {
      refundStatus = 'refunded';
      logger.info(`Manual refund processed for COD order ${order.orderNumber}`);
    } else {
      return res.status(400).json({ success: false, message: 'Unable to process refund: No payment method information available' });
    }

    if (amount === order.totalPrice) order.paymentStatus = 'refunded';

    order.notes = order.notes
      ? `${order.notes}\n\nRefund: $${amount.toFixed(2)} on ${new Date().toLocaleString()}${reason ? ` - ${reason}` : ''}${refundId ? ` (Refund ID: ${refundId})` : ''}`
      : `Refund: $${amount.toFixed(2)} on ${new Date().toLocaleString()}${reason ? ` - ${reason}` : ''}${refundId ? ` (Refund ID: ${refundId})` : ''}`;

    await order.save();

    try {
      const user = await User.findById(order.user);
      if (user) {
        await sendOrderCancellationEmail(user.email, user.firstName, order.orderNumber || '', {
          items: order.items.map(item => ({ name: item.name, quantity: item.quantity, price: item.price, image: item.image })),
          totalPrice: order.totalPrice,
          refundAmount: amount,
          createdAt: order.createdAt
        });
      }
    } catch (emailError) {
      logger.error('Failed to send refund email:', emailError);
    }

    res.status(200).json({ success: true, message: 'Refund processed successfully', data: { order, refundId, refundAmount: amount, refundStatus } });
  } catch (error: any) {
    logger.error('Refund processing error:', error);
    next(error);
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const orderId = extractObjectId(req.params.id);
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format', errors: [{ field: 'id', message: 'Invalid ID format' }] });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const userId = extractObjectId(req.user?._id);
    const orderUserId = extractObjectId(order.user);
    if (!userId || !orderUserId || !userId.equals(orderUserId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    const cancellationWindowHours = 24;
    const hoursSinceOrder = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60);
    const canCancelByTime = hoursSinceOrder <= cancellationWindowHours;
    const canCancelByStatus = ['pending', 'processing'].includes(order.orderStatus);
    const cannotCancelStatuses = ['shipped', 'delivered', 'cancelled'];

    if (cannotCancelStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: `Cannot cancel order. Order is already ${order.orderStatus}.`, canCancel: false });
    }
    if (!canCancelByTime && canCancelByStatus) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order. Cancellation window (${cancellationWindowHours} hours) has expired. Please contact customer service for assistance.`,
        canCancel: false,
        hoursSinceOrder: Math.round(hoursSinceOrder * 10) / 10
      });
    }
    if (!canCancelByStatus) {
      return res.status(400).json({ success: false, message: `Cannot cancel order. Order status is ${order.orderStatus}.`, canCancel: false });
    }

    const useTransactions = process.env.NODE_ENV !== 'test';
    let session: mongoose.ClientSession | null = null;
    if (useTransactions) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (error) {
        session = null;
      }
    }

    try {
      order.orderStatus = 'cancelled';
      if (reason) {
        order.notes = order.notes ? `${order.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
      }
      await order.save(session ? { session } : {});

      for (const item of order.items) {
        const product = session ? await Product.findById(item.product).session(session) : await Product.findById(item.product);
        if (product) {
          product.totalStock += item.quantity;
          product.inStock = product.totalStock > 0;
          await product.save(session ? { session } : {});
        }
      }

      if (session) { await session.commitTransaction(); session.endSession(); }

      const normalizedOrder = normalizeOrderId(order);

      try {
        const user = await User.findById(order.user).select('email firstName lastName').lean();
        if (user && user.email) {
          const fullOrder = await Order.findById(order._id).lean();
          if (fullOrder && fullOrder.orderNumber) {
            await addEmailJob(
              'order-cancellation',
              {
                email: user.email,
                firstName: user.firstName || 'Customer',
                orderNumber: fullOrder.orderNumber,
                orderData: {
                  items: fullOrder.items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price, image: item.image })),
                  totalPrice: fullOrder.totalPrice,
                  cancellationReason: reason || 'Customer request',
                  refundAmount: fullOrder.totalPrice,
                  createdAt: fullOrder.createdAt
                }
              },
              async () => {
                await sendOrderCancellationEmail(user.email, user.firstName || 'Customer', fullOrder.orderNumber, {
                  items: fullOrder.items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price, image: item.image })),
                  totalPrice: fullOrder.totalPrice,
                  cancellationReason: reason || 'Customer request',
                  refundAmount: fullOrder.totalPrice,
                  createdAt: fullOrder.createdAt
                });
              }
            );
          }
        }
      } catch (emailError) {
        logger.error('Error queuing order cancellation email:', emailError);
      }

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: normalizedOrder,
        refundInfo: order.isPaid ? { willRefund: true, refundAmount: order.totalPrice, refundMethod: 'original', estimatedTime: '5-7 business days' } : null
      });
    } catch (error: any) {
      if (session) {
        try { await session.abortTransaction(); } catch (abortError) {}
        try { session.endSession(); } catch (endError) {}
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'orders:stats:all';
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      return res.status(200).json(cached);
    }

    const statsPipeline = [{ $facet: { statusCounts: [{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }], revenue: [{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }], donations: [{ $match: { donationAmount: { $gt: 0 } } }, { $group: { _id: null, totalDonations: { $sum: '$donationAmount' }, donationCount: { $sum: 1 }, averageDonation: { $avg: '$donationAmount' } } }], totalCount: [{ $group: { _id: null, count: { $sum: 1 } } }] } }];

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const combinedStatsPipeline = [{ $facet: { monthlyDonations: [{ $match: { donationAmount: { $gt: 0 }, createdAt: { $gte: oneYearAgo } } }, { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: '$donationAmount' }, count: { $sum: 1 } } }, { $sort: { '_id.year': 1 as const, '_id.month': 1 as const } }, { $limit: 12 }], monthlySales: [{ $match: { paymentStatus: 'paid', createdAt: { $gte: sixMonthsAgo } } }, { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, sales: { $sum: '$totalPrice' }, orderCount: { $sum: 1 } } }, { $sort: { '_id.year': 1 as const, '_id.month': 1 as const } }] } }];

    const revenueTrendPipeline = [{ $facet: { currentMonthRevenue: [{ $match: { paymentStatus: 'paid', createdAt: { $gte: currentMonthStart } } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }], previousMonthRevenue: [{ $match: { paymentStatus: 'paid', createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }], currentMonthOrders: [{ $match: { createdAt: { $gte: currentMonthStart } } }, { $group: { _id: null, count: { $sum: 1 } } }], previousMonthOrders: [{ $match: { createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } } }, { $group: { _id: null, count: { $sum: 1 } } }] } }];

    const [statsResult, combinedStats, revenueTrendResult] = await Promise.all([
      executeCachedAggregation('orders', statsPipeline, async () => await Order.aggregate(statsPipeline as any, { allowDiskUse: true }), 300),
      executeCachedAggregation('orders', combinedStatsPipeline, async () => await Order.aggregate(combinedStatsPipeline as any, { allowDiskUse: true }), 300),
      executeCachedAggregation('orders', revenueTrendPipeline, async () => await Order.aggregate(revenueTrendPipeline as any, { allowDiskUse: true }), 120)
    ]);

    const stats = statsResult[0] || {};
    const statusCounts = (stats.statusCounts || []).reduce((acc: any, item: any) => { acc[item._id] = item.count; return acc; }, {});

    const totalOrders = stats.totalCount?.[0]?.count || 0;
    const pendingOrders = statusCounts.pending || 0;
    const processingOrders = statusCounts.processing || 0;
    const shippedOrders = statusCounts.shipped || 0;
    const deliveredOrders = statusCounts.delivered || 0;
    const totalRevenue = stats.revenue?.[0]?.totalRevenue || 0;
    const donationStats = stats.donations?.[0] || {};
    const totalDonations = donationStats.totalDonations || 0;
    const donationCount = donationStats.donationCount || 0;
    const averageDonation = donationStats.averageDonation || 0;
    const monthlyDonations = combinedStats[0]?.monthlyDonations || [];
    const monthlySales = combinedStats[0]?.monthlySales || [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlySales = monthlySales.map((item: any) => ({ month: monthNames[item._id.month - 1], sales: item.sales || 0, orderCount: item.orderCount || 0 }));

    const trendData = revenueTrendResult[0] || {};
    const currentMonthTotal = trendData.currentMonthRevenue?.[0]?.total || 0;
    const previousMonthTotal = trendData.previousMonthRevenue?.[0]?.total || 0;
    const currentMonthOrders = trendData.currentMonthOrders?.[0]?.count || 0;
    const previousMonthOrders = trendData.previousMonthOrders?.[0]?.count || 0;
    const revenueTrend = previousMonthTotal > 0 ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;
    const ordersTrend = previousMonthOrders > 0 ? ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100 : 0;

    const [recentOrders] = await Promise.all([
      Order.find({}).select('_id orderNumber totalPrice orderStatus paymentStatus createdAt user').sort({ createdAt: -1 }).limit(5).lean().maxTimeMS(3000)
    ]);

    const userIds = recentOrders.map((order: any) => order.user).filter((id: any): id is mongoose.Types.ObjectId => id !== null && id !== undefined);
    const usersMap = new Map();
    if (userIds.length > 0) {
      const uniqueUserIds = Array.from(new Set(userIds.map(id => id.toString()))).map(id => new mongoose.Types.ObjectId(id));
      const User = (await import('../models/User')).default;
      const users = await User.find({ _id: { $in: uniqueUserIds } }).select('firstName lastName email').lean();
      users.forEach((user: any) => { usersMap.set(user._id.toString(), user); });
    }

    const recentOrdersWithUsers = recentOrders.map((order: any) => {
      const userData = order.user ? usersMap.get(order.user.toString()) : null;
      return {
        ...order,
        _id: order._id ? order._id.toString() : order._id,
        user: userData ? { firstName: userData.firstName, lastName: userData.lastName, email: userData.email } : null
      };
    });

    const response = {
      success: true,
      data: {
        totalOrders, pendingOrders, processingOrders, shippedOrders, deliveredOrders,
        totalRevenue, totalDonations, donationCount, averageDonation, monthlyDonations,
        monthlySales: formattedMonthlySales, revenueTrend, ordersTrend,
        currentMonthRevenue: currentMonthTotal, previousMonthRevenue: previousMonthTotal,
        currentMonthOrders, previousMonthOrders, recentOrders: recentOrdersWithUsers || []
      }
    };

    await cache.set(cacheKey, response, 300);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const trackOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    let order;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).populate('user', 'firstName lastName email').select('-billingAddress');
    } else {
      order = await Order.findOne({ orderNumber: id.toUpperCase() }).populate('user', 'firstName lastName email').select('-billingAddress');
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found. Please check your order number and try again.' });
    }

    const trackingInfo = {
      _id: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber,
      items: order.items.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
      shippingAddress: { firstName: order.shippingAddress.firstName, lastName: order.shippingAddress.lastName, city: order.shippingAddress.city, state: order.shippingAddress.state, zipCode: order.shippingAddress.zipCode },
      itemsPrice: order.itemsPrice,
      shippingPrice: order.shippingPrice,
      taxPrice: order.taxPrice,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      isDelivered: order.isDelivered,
      deliveredAt: order.deliveredAt
    };

    res.status(200).json({ success: true, data: trackingInfo });
  } catch (error) {
    next(error);
  }
};

// GUEST CHECKOUT: works without authentication
export const createOrderPaymentIntent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { totalPrice, paymentMethod } = req.body;

    if (!totalPrice || totalPrice < 0.5) {
      return res.status(400).json({ success: false, message: 'Order total must be at least $0.50' });
    }

    const validMethods = ['credit_card', 'paypal', 'apple_pay', 'google_pay'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method. Use credit_card, paypal, apple_pay, or google_pay' });
    }

    if (!stripe) {
      return res.status(500).json({ success: false, message: 'Payment processing not configured. Please set STRIPE_SECRET_KEY in environment variables.' });
    }

    const amountInCents = Math.round(totalPrice * 100);

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        payment_method_types: paymentMethod === 'credit_card' ? ['card'] : paymentMethod === 'apple_pay' ? ['card', 'apple_pay'] : paymentMethod === 'google_pay' ? ['card', 'google_pay'] : ['card'],
        metadata: {
          order: 'true',
          userId: String(req.user?._id || 'guest'),
          userEmail: req.user?.email || '',
          userName: req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : 'Guest'
        }
      });

      res.status(200).json({ success: true, data: { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id } });
    } catch (stripeError: unknown) {
      logger.error('Stripe error:', stripeError);
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
      return res.status(500).json({ success: false, message: 'Payment processing error: ' + errorMessage });
    }
  } catch (error: unknown) {
    logger.error('Payment intent error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent';
    res.status(500).json({ success: false, message: errorMessage });
  }
};

export const confirmOrderPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) return res.status(400).json({ success: false, message: 'Payment Intent ID is required' });
    if (!stripe) return res.status(500).json({ success: false, message: 'Payment processing not configured.' });

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status === 'succeeded') {
        return res.status(200).json({ success: true, message: 'Payment confirmed successfully', data: { paymentStatus: 'paid', paymentIntentId: paymentIntent.id, amount: paymentIntent.amount / 100 } });
      } else {
        return res.status(400).json({ success: false, message: 'Payment not completed', data: { paymentStatus: paymentIntent.status } });
      }
    } catch (stripeError: unknown) {
      logger.error('Stripe verification error:', stripeError);
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
      return res.status(500).json({ success: false, message: 'Payment verification failed: ' + errorMessage });
    }
  } catch (error: unknown) {
    logger.error('Payment confirmation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to confirm payment';
    res.status(500).json({ success: false, message: errorMessage });
  }
};

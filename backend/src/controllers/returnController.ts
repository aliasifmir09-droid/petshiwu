import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Return from '../models/Return';
import Order from '../models/Order';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

// Create return request
export const createReturn = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId, items, reason, notes, returnAddress } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!orderId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and return items are required'
      });
    }

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to return this order'
      });
    }

    // Check if order is eligible for return (must be delivered)
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Order must be delivered before requesting a return'
      });
    }

    // Check return window (e.g., 30 days from delivery)
    const returnWindowDays = 30;
    const deliveryDate = order.deliveredAt || order.createdAt;
    const daysSinceDelivery = (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceDelivery > returnWindowDays) {
      return res.status(400).json({
        success: false,
        message: `Return window has expired. Returns must be requested within ${returnWindowDays} days of delivery.`,
        daysSinceDelivery: Math.round(daysSinceDelivery)
      });
    }

    // Validate return items
    const returnItems = [];
    let totalRefundAmount = 0;

    for (const item of items) {
      // Find order item - handle both _id matching and index-based matching
      let orderItem: typeof order.items[0] | null = null;
      let orderItemIndex = -1;
      
      for (let i = 0; i < order.items.length; i++) {
        const oi = order.items[i];
        // Order items don't have _id in the schema, use index
        const oiId = i.toString();
        if (safeToString(oi.product) === item.productId && oiId === item.orderItemId) {
          orderItem = oi;
          orderItemIndex = i;
          break;
        }
      }

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: `Order item not found: ${item.orderItemId}`
        });
      }

      if (item.quantity > orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Return quantity (${item.quantity}) exceeds ordered quantity (${orderItem.quantity})`
        });
      }

      // Use orderItem _id if available, otherwise use index
      const orderItemId = orderItem._id || orderItemIndex;

      returnItems.push({
        orderItem: orderItemId,
        product: item.productId,
        quantity: item.quantity,
        reason: item.reason,
        condition: item.condition
      });

      totalRefundAmount += orderItem.price * item.quantity;
    }

    // Create return request
    const returnRequest = await Return.create({
      order: orderId,
      user: userId,
      items: returnItems,
      reason,
      notes,
      returnAddress: returnAddress || order.shippingAddress,
      refundAmount: totalRefundAmount,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Return request created successfully',
      data: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

// Get user's return requests
export const getMyReturns = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const returns = await Return.find({ user: userId })
      .populate('order', 'orderNumber createdAt')
      .populate('items.product', 'name slug images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Return.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      data: returns,
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

// Get single return request
export const getReturn = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const returnRequest = await Return.findById(id)
      .populate('order')
      .populate('items.product', 'name slug images')
      .lean();

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: 'Return request not found'
      });
    }

    // Check authorization (user or admin)
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'staff';
    if (!isAdmin && returnRequest.user.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this return'
      });
    }

    res.status(200).json({
      success: true,
      data: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

// Update return status (Admin)
export const updateReturnStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, refundMethod } = req.body;

    const returnRequest = await Return.findById(id);
    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: 'Return request not found'
      });
    }

    const validStatuses: Array<IReturn['status']> = ['pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status as IReturn['status'])) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (status && validStatuses.includes(status as IReturn['status'])) {
      returnRequest.status = status as IReturn['status'];
    }

    if (adminNotes) {
      returnRequest.adminNotes = adminNotes;
    }

    const validRefundMethods: Array<IReturn['refundMethod']> = ['original', 'store_credit'];
    if (refundMethod && validRefundMethods.includes(refundMethod as IReturn['refundMethod'])) {
      returnRequest.refundMethod = refundMethod as IReturn['refundMethod'];
    }

    // When approved, RMA number is generated automatically via pre-save hook
    // When completed, process refund
    if (status === 'completed') {
      returnRequest.refundStatus = 'processing';
      // In production, integrate with payment processor for actual refund
      // For now, mark as refunded after a delay
      setTimeout(() => {
        Return.findByIdAndUpdate(id, { refundStatus: 'refunded' }).catch(err => {
          logger.error('Error updating refund status:', err);
        });
      }, 1000);
    }

    await returnRequest.save();

    res.status(200).json({
      success: true,
      message: 'Return status updated successfully',
      data: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

// Get all returns (Admin)
export const getAllReturns = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const returns = await Return.find(query)
      .populate('order', 'orderNumber createdAt')
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name slug images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Return.countDocuments(query);

    res.status(200).json({
      success: true,
      data: returns,
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


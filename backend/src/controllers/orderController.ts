import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';

// Create new order
export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('Order creation request received:', {
      itemsCount: req.body.items?.length,
      hasShippingAddress: !!req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      userId: req.user?._id
    });
    
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      donationAmount,
      totalPrice
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

    // Verify stock availability
    for (const item of items) {
      // Convert product ID to string if it's an object
      let productId: string | null = null;
      const rawProductId = item.product;
      
      if (!rawProductId) {
        console.error('Product ID is missing in item:', item);
        return res.status(400).json({
          success: false,
          message: `Product ID is missing for item: ${item.name || 'Unknown'}`,
          errors: [`Item "${item.name || 'Unknown'}" has no product ID`]
        });
      }
      
      // Handle different types of product IDs
      if (typeof rawProductId === 'string') {
        productId = rawProductId;
      } else if (typeof rawProductId === 'object' && rawProductId !== null) {
        // Handle ObjectId objects
        if ('toString' in rawProductId && typeof (rawProductId as any).toString === 'function') {
          productId = (rawProductId as any).toString();
        } else if ('_id' in rawProductId) {
          productId = String((rawProductId as any)._id);
        } else {
          productId = String(rawProductId);
        }
      } else {
        productId = String(rawProductId);
      }
      
      // Validate MongoDB ObjectId format
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        console.error('Invalid product ID format:', { productId, rawProductId, itemName: item.name });
        return res.status(400).json({
          success: false,
          message: `Invalid product ID for item: ${item.name || 'Unknown'}`,
          errors: [`Product ID "${productId}" is not a valid MongoDB ObjectId`]
        });
      }
      
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.name || productId} not found`,
          errors: [`Product with ID "${productId}" does not exist in database`]
        });
      }
      if (!product.inStock) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.name} is out of stock`,
          errors: [`Product "${item.name}" is currently out of stock`]
        });
      }
    }

    // Convert product IDs in items to strings (MongoDB will convert them to ObjectIds)
    const normalizedItems = items.map((item: any) => ({
      ...item,
      product: item.product ? String(item.product) : item.product
    }));

    const order = await Order.create({
      user: req.user._id,
      items: normalizedItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      donationAmount: donationAmount || 0,
      totalPrice
    });

    // Update product stock
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.totalStock -= item.quantity;
        product.inStock = product.totalStock > 0;
        await product.save();
      }
    }

    res.status(201).json({
      success: true,
      data: order
    });
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
    console.error('Error normalizing order:', error);
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
      console.error('Error normalizing order in array:', error);
      return order;
    }
  }).filter((order: any) => order !== null && order !== undefined);
};

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
    console.error('Error in getMyOrders:', error);
    next(error);
  }
};

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
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
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

// Update order status (Admin)
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderStatus, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.orderStatus = orderStatus || order.orderStatus;
    
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (orderStatus === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
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

// Cancel order (Customer)
export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Make sure user can only cancel their own orders
    if (order.user.toString() !== (req.user?._id as any)?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Only allow cancellation if order is still pending
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order. Order is already ${order.orderStatus}. Only pending orders can be cancelled.`
      });
    }

    // Update order status to cancelled
    order.orderStatus = 'cancelled';
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.totalStock += item.quantity;
        product.inStock = product.totalStock > 0;
        await product.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

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




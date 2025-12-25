/**
 * Order Notification System
 * Handles real-time order notifications for admin dashboard
 */

import { EventEmitter } from 'events';
import logger from './logger';

// Create a singleton event emitter for order notifications
class OrderNotificationEmitter extends EventEmitter {
  private static instance: OrderNotificationEmitter;

  private constructor() {
    super();
    // Set max listeners to prevent memory leaks
    this.setMaxListeners(100);
  }

  public static getInstance(): OrderNotificationEmitter {
    if (!OrderNotificationEmitter.instance) {
      OrderNotificationEmitter.instance = new OrderNotificationEmitter();
    }
    return OrderNotificationEmitter.instance;
  }
}

export const orderNotificationEmitter = OrderNotificationEmitter.getInstance();

/**
 * Emit a new order notification
 */
export const notifyNewOrder = (order: any) => {
  try {
    const notification = {
      type: 'new_order',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalPrice: order.totalPrice,
        items: order.items?.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })) || [],
        user: order.user,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt
      },
      timestamp: new Date().toISOString()
    };

    orderNotificationEmitter.emit('new_order', notification);
    logger.debug('New order notification emitted', { orderNumber: order.orderNumber });
  } catch (error: any) {
    logger.error('Error emitting order notification:', error);
  }
};

/**
 * Emit an order status update notification
 */
export const notifyOrderUpdate = (order: any, updateType: 'status' | 'payment' = 'status') => {
  try {
    const notification = {
      type: 'order_update',
      updateType,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        totalPrice: order.totalPrice
      },
      timestamp: new Date().toISOString()
    };

    orderNotificationEmitter.emit('order_update', notification);
    logger.debug('Order update notification emitted', { orderNumber: order.orderNumber, updateType });
  } catch (error: any) {
    logger.error('Error emitting order update notification:', error);
  }
};


/**
 * Real-time Notifications Route
 * Server-Sent Events (SSE) for real-time order notifications
 */

import { Router, Request, Response } from 'express';
import { protect, admin } from '../middleware/auth';
import { orderNotificationEmitter } from '../utils/orderNotifications';
import logger from '../utils/logger';

const router = Router();

/**
 * SSE endpoint for real-time order notifications
 * GET /api/notifications/orders
 */
router.get('/orders', protect, admin, (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to order notifications' })}\n\n`);

  // Keep connection alive with heartbeat
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch (error) {
      // Client disconnected
      clearInterval(heartbeatInterval);
    }
  }, 30000); // Send heartbeat every 30 seconds

  // Listen for new order notifications
  const onNewOrder = (notification: any) => {
    try {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    } catch (error) {
      logger.error('Error sending SSE notification:', error);
      cleanup();
    }
  };

  // Listen for order update notifications
  const onOrderUpdate = (notification: any) => {
    try {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    } catch (error) {
      logger.error('Error sending SSE notification:', error);
      cleanup();
    }
  };

  // Register event listeners
  orderNotificationEmitter.on('new_order', onNewOrder);
  orderNotificationEmitter.on('order_update', onOrderUpdate);

  // Cleanup function
  const cleanup = () => {
    clearInterval(heartbeatInterval);
    orderNotificationEmitter.removeListener('new_order', onNewOrder);
    orderNotificationEmitter.removeListener('order_update', onOrderUpdate);
    res.end();
  };

  // Handle client disconnect
  req.on('close', () => {
    logger.debug('SSE client disconnected');
    cleanup();
  });

  // Handle errors
  req.on('error', (error) => {
    logger.error('SSE connection error:', error);
    cleanup();
  });
});

export default router;


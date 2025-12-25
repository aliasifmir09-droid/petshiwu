/**
 * Real-time Notifications Route
 * Server-Sent Events (SSE) for real-time order notifications
 */

import { Router, Request, Response } from 'express';
import { protect, authorize } from '../middleware/auth';
import { orderNotificationEmitter } from '../utils/orderNotifications';
import logger from '../utils/logger';

const router = Router();

/**
 * SSE endpoint for real-time order notifications
 * GET /api/notifications/orders
 */
router.get('/orders', protect, authorize('admin'), (req: Request, res: Response) => {
  let isCleanedUp = false;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  // Helper function to check if response is still writable
  const isWritable = (): boolean => {
    return !isCleanedUp && !res.writableEnded && !res.destroyed && res.writable;
  };

  // Helper function to check if error is an expected disconnect
  const isExpectedDisconnect = (error: any): boolean => {
    if (!error) return false;
    
    // Check error code
    if (error.code === 'ECONNRESET' || error.code === 'EPIPE' || error.code === 'ECONNABORTED') {
      return true;
    }
    
    // Check error message (handle both string and object errors)
    // Try multiple ways to extract the error message
    let errorMessage = '';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.toString) {
      errorMessage = error.toString();
    } else {
      // Try JSON.stringify as last resort
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = String(error);
      }
    }
    
    const lowerMessage = errorMessage.toLowerCase();
    
    // Check for various disconnect-related messages
    if (lowerMessage.includes('aborted') || 
        lowerMessage.includes('econnreset') || 
        lowerMessage.includes('epipe') ||
        lowerMessage.includes('broken pipe') ||
        lowerMessage.includes('socket hang up') ||
        lowerMessage.includes('connection reset') ||
        lowerMessage.includes('write after end') ||
        lowerMessage.includes('cannot write after end')) {
      return true;
    }
    
    // Also check if error is an Error object with specific properties
    if (error instanceof Error) {
      const errorName = error.name?.toLowerCase() || '';
      if (errorName.includes('abort') || errorName.includes('reset')) {
        return true;
      }
    }
    
    return false;
  };

  // Helper function to safely write to response
  const safeWrite = (data: string): boolean => {
    if (!isWritable()) {
      return false;
    }
    try {
      res.write(data);
      return true;
    } catch (error: any) {
      // Expected disconnect errors, don't log
      if (isExpectedDisconnect(error)) {
        return false;
      }
      // Only log unexpected errors
      logger.debug('SSE write error (unexpected):', error?.message || error);
      return false;
    }
  };

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection message
  if (!safeWrite(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to order notifications' })}\n\n`)) {
    return;
  }

  // Keep connection alive with heartbeat
  heartbeatInterval = setInterval(() => {
    if (!safeWrite(`: heartbeat\n\n`)) {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    }
  }, 30000); // Send heartbeat every 30 seconds

  // Listen for new order notifications
  const onNewOrder = (notification: any) => {
    if (!safeWrite(`data: ${JSON.stringify(notification)}\n\n`)) {
      cleanup();
    }
  };

  // Listen for order update notifications
  const onOrderUpdate = (notification: any) => {
    if (!safeWrite(`data: ${JSON.stringify(notification)}\n\n`)) {
      cleanup();
    }
  };

  // Register event listeners
  orderNotificationEmitter.on('new_order', onNewOrder);
  orderNotificationEmitter.on('order_update', onOrderUpdate);

  // Cleanup function
  const cleanup = () => {
    if (isCleanedUp) {
      return; // Prevent multiple cleanups
    }
    isCleanedUp = true;

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    orderNotificationEmitter.removeListener('new_order', onNewOrder);
    orderNotificationEmitter.removeListener('order_update', onOrderUpdate);

    if (!res.writableEnded && !res.destroyed) {
      try {
        res.end();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  };

  // Handle client disconnect (expected)
  req.on('close', () => {
    cleanup();
  });

  // Handle request errors
  req.on('error', (error: any) => {
    // Double-check: if error string contains "aborted", treat as expected disconnect
    const errorStr = String(error || '').toLowerCase();
    if (isExpectedDisconnect(error) || errorStr.includes('aborted')) {
      // Expected disconnect, don't log as error
      cleanup();
      return;
    }
    // Only log unexpected errors
    logger.error('SSE connection error:', error);
    cleanup();
  });

  // Handle response errors
  res.on('error', (error: any) => {
    // Double-check: if error string contains "aborted", treat as expected disconnect
    const errorStr = String(error || '').toLowerCase();
    if (isExpectedDisconnect(error) || errorStr.includes('aborted')) {
      // Expected disconnect, don't log as error
      cleanup();
      return;
    }
    // Only log unexpected errors
    logger.error('SSE response error:', error);
    cleanup();
  });

  // Handle response finish
  res.on('finish', () => {
    cleanup();
  });
});

export default router;


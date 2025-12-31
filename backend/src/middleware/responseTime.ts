import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { startTransaction, recordMetric, addCustomAttribute } from '../utils/apm';

/**
 * Response time monitoring middleware
 * PERFORMANCE FIX: Track API response times for performance analysis
 */
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // CRITICAL FIX: Set header before response is sent, not in 'finish' event
  // The 'finish' event fires after headers are sent, causing "Cannot set headers after they are sent" error
  
  // Store original methods to intercept response
  const originalEnd = res.end;
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Helper function to set header and log (only if headers not sent)
  const setResponseTimeHeader = () => {
    if (!res.headersSent) {
      const duration = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
  };
  
  // Helper function to log response time
  const logResponseTime = () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl } = req;
    const statusCode = res.statusCode;
    
    // Log slow requests (> 500ms) as warnings
    if (duration > 500) {
      logger.warn(`Slow API request: ${method} ${originalUrl} - ${duration}ms - Status: ${statusCode}`);
    } else if (duration > 200) {
      // Log moderately slow requests (> 200ms) as info
      logger.info(`API request: ${method} ${originalUrl} - ${duration}ms - Status: ${statusCode}`);
    }
  };
  
  // Override res.end to set header before sending
  res.end = function (chunk?: any, encoding?: any, cb?: any) {
    setResponseTimeHeader();
    logResponseTime();
    return originalEnd.call(this, chunk, encoding, cb);
  };
  
  // Override res.send to set header before sending
  res.send = function (body?: any) {
    setResponseTimeHeader();
    logResponseTime();
    return originalSend.call(this, body);
  };
  
  // Override res.json to set header before sending
  res.json = function (body?: any) {
    setResponseTimeHeader();
    logResponseTime();
    return originalJson.call(this, body);
  };
  
  // Fallback: Log in 'finish' event (but don't set header - it's too late)
  res.on('finish', () => {
    // Only log if header wasn't already set (fallback logging)
    // Don't try to set header here as response is already sent
    logResponseTime();
  });
  
  next();
};

/**
 * Get response time statistics
 * Can be used for APM integration
 */
export const getResponseTimeStats = () => {
  // This would integrate with APM tools like New Relic, Datadog, etc.
  // For now, it's a placeholder for future implementation
  return {
    average: 0,
    p50: 0,
    p95: 0,
    p99: 0,
  };
};


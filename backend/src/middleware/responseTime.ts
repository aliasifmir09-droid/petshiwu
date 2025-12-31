import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Response time monitoring middleware
 * PERFORMANCE FIX: Track API response times for performance analysis
 */
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Track response time when response finishes
  res.on('finish', () => {
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
    
    // Add response time header for client-side monitoring
    res.setHeader('X-Response-Time', `${duration}ms`);
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


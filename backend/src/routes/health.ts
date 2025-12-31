import express from 'express';
import { checkDatabaseHealth, getConnectionPoolStatus } from '../utils/databaseOptimization';
import { isDatabaseConnected } from '../utils/database';
import { getRedisStatus } from '../utils/cache';
import { getQueueStats } from '../utils/jobQueue';
import { getSlowQueries, getQueryStats } from '../utils/queryProfiler';
import logger from '../utils/logger';

const router = express.Router();

/**
 * Simple health check endpoint (doesn't require database)
 * GET /api/health/ping
 */
router.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Health check endpoint for monitoring
 * GET /api/health
 */
router.get('/', async (req, res) => {
  try {
    const isConnected = isDatabaseConnected();
    const poolStatus = getConnectionPoolStatus();
    const redisStatus = await getRedisStatus();
    
    if (!isConnected) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        redis: redisStatus,
        timestamp: new Date().toISOString(),
      });
    }

    const health = await checkDatabaseHealth();
    
    res.status(health.healthy ? 200 : 503).json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      database: health,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Database connection pool status with detailed metrics
 * GET /api/health/pool
 */
router.get('/pool', async (req, res) => {
  try {
    const poolStatus = getConnectionPoolStatus();
    const dbHealth = await checkDatabaseHealth();
    
    res.json({
      success: true,
      data: {
        ...poolStatus,
        health: dbHealth,
        metrics: {
          poolUtilization: poolStatus.maxPoolSize && poolStatus.currentConnections 
            ? Math.round((poolStatus.currentConnections / poolStatus.maxPoolSize) * 100) 
            : 0,
          activeUtilization: poolStatus.maxPoolSize && poolStatus.activeConnections
            ? Math.round((poolStatus.activeConnections / poolStatus.maxPoolSize) * 100)
            : 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PERFORMANCE FIX: Get query performance stats
 * GET /api/health/queries
 */
router.get('/queries', async (req, res) => {
  try {
    const slowQueries = await getSlowQueries(10);
    const stats = getQueryStats();
    
    res.json({
      success: true,
      data: {
        slowQueries,
        stats,
        threshold: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '100', 10),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error getting query stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get query statistics',
      error: error.message,
    });
  }
});

/**
 * Job queue statistics
 * GET /api/health/queues
 */
router.get('/queues', async (req, res) => {
  try {
    const queueStats = await getQueueStats();
    res.json({
      success: true,
      data: queueStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Redis status check
 * GET /api/health/redis
 */
router.get('/redis', async (req, res) => {
  try {
    const redisStatus = await getRedisStatus();
    res.status(redisStatus.connected ? 200 : 503).json({
      success: redisStatus.connected,
      ...redisStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      available: false,
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;


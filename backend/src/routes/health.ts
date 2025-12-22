import express from 'express';
import { checkDatabaseHealth, getConnectionPoolStatus } from '../utils/databaseOptimization';
import { isDatabaseConnected } from '../utils/database';
import { getRedisStatus } from '../utils/cache';

const router = express.Router();

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
 * Database connection pool status
 * GET /api/health/pool
 */
router.get('/pool', (req, res) => {
  try {
    const poolStatus = getConnectionPoolStatus();
    res.json({
      success: true,
      data: poolStatus,
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


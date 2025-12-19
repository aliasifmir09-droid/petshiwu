import express from 'express';
import { checkDatabaseHealth, getConnectionPoolStatus } from '../utils/databaseOptimization';
import { isDatabaseConnected } from '../utils/database';

const router = express.Router();

/**
 * Health check endpoint for monitoring
 * GET /api/health
 */
router.get('/', async (req, res) => {
  try {
    const isConnected = isDatabaseConnected();
    const poolStatus = getConnectionPoolStatus();
    
    if (!isConnected) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }

    const health = await checkDatabaseHealth();
    
    res.status(health.healthy ? 200 : 503).json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      database: health,
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

export default router;


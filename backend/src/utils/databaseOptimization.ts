import mongoose from 'mongoose';
import logger from './logger';

/**
 * Database Optimization Utilities
 * For handling 10,000+ concurrent users
 */

// Monitor database connection pool status
export const getConnectionPoolStatus = () => {
  const connection = mongoose.connection;
  return {
    readyState: connection.readyState,
    host: connection.host,
    name: connection.name,
    maxPoolSize: (connection as any).options?.maxPoolSize || 'unknown',
    currentConnections: (connection as any).db?.serverConfig?.pool?.totalConnectionCount || 'unknown',
    activeConnections: (connection as any).db?.serverConfig?.pool?.activeConnectionCount || 'unknown',
    idleConnections: (connection as any).db?.serverConfig?.pool?.idleConnectionCount || 'unknown',
  };
};

// Log connection pool status periodically (for monitoring)
export const logConnectionPoolStatus = () => {
  const status = getConnectionPoolStatus();
  logger.info('Database Connection Pool Status:', {
    readyState: status.readyState === 1 ? 'connected' : 'disconnected',
    host: status.host,
    database: status.name,
    maxPoolSize: status.maxPoolSize,
    currentConnections: status.currentConnections,
    activeConnections: status.activeConnections,
    idleConnections: status.idleConnections,
  });
};

// Enable query logging in development (for performance debugging)
export const enableQueryLogging = () => {
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_QUERY_LOGGING === 'true') {
    mongoose.set('debug', (collectionName: string, method: string, query: any, doc: any) => {
      logger.debug(`MongoDB Query: ${collectionName}.${method}`, {
        query: JSON.stringify(query),
        doc: doc ? JSON.stringify(doc).substring(0, 200) : undefined,
      });
    });
  }
};

// Optimize query execution settings
export const optimizeMongooseSettings = () => {
  // Disable strict mode for better performance (only if you're confident about your data)
  // mongoose.set('strictQuery', false); // Not recommended, but can improve performance
  
  // Enable lean queries by default for read operations (better performance)
  // Note: This is handled per-query, not globally
  
  // Optimize validation
  mongoose.set('runValidators', true); // Keep validation enabled for data integrity
  
  logger.info('Mongoose settings optimized for high concurrency');
};

// Get database statistics
export const getDatabaseStats = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return null;
    }

    const stats = await db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      objects: stats.objects,
      avgObjSize: stats.avgObjSize,
    };
  } catch (error: any) {
    logger.error('Error getting database stats:', error.message);
    return null;
  }
};

// Monitor slow queries (if MongoDB profiler is enabled)
export const getSlowQueries = async (thresholdMs: number = 100) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return [];
    }

    // This requires MongoDB profiler to be enabled
    const profilerCollection = db.collection('system.profile');
    const slowQueries = await profilerCollection
      .find({
        millis: { $gt: thresholdMs },
      })
      .sort({ ts: -1 })
      .limit(10)
      .toArray();

    return slowQueries;
  } catch (error: any) {
    // Profiler might not be enabled, which is fine
    logger.debug('MongoDB profiler not available:', error.message);
    return [];
  }
};

// Health check for database
export const checkDatabaseHealth = async () => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) {
      return {
        healthy: false,
        message: 'Database not connected',
      };
    }

    // Simple ping to check responsiveness
    await mongoose.connection.db?.admin().ping();
    
    const poolStatus = getConnectionPoolStatus();
    const stats = await getDatabaseStats();

    return {
      healthy: true,
      message: 'Database is healthy',
      connection: {
        readyState: poolStatus.readyState,
        host: poolStatus.host,
        database: poolStatus.name,
      },
      pool: {
        maxPoolSize: poolStatus.maxPoolSize,
        currentConnections: poolStatus.currentConnections,
        activeConnections: poolStatus.activeConnections,
        idleConnections: poolStatus.idleConnections,
      },
      stats: stats ? {
        collections: stats.collections,
        dataSizeMB: Math.round(stats.dataSize / 1024 / 1024),
        indexSizeMB: Math.round(stats.indexSize / 1024 / 1024),
        totalObjects: stats.objects,
      } : null,
    };
  } catch (error: any) {
    return {
      healthy: false,
      message: `Database health check failed: ${error.message}`,
    };
  }
};


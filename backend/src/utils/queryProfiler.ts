import mongoose from 'mongoose';
import logger from './logger';

/**
 * MongoDB Query Profiler Utility
 * PERFORMANCE FIX: Monitor and log slow database queries
 */

// Track slow queries in memory (can be replaced with APM tool)
const slowQueries: Array<{
  operation: string;
  collection: string;
  duration: number;
  timestamp: Date;
  query?: any;
}> = [];

const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '100', 10);

/**
 * Enable MongoDB query profiling
 * This logs all queries that exceed the slow query threshold
 */
export const enableQueryProfiling = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      logger.warn('Database not connected. Cannot enable query profiling.');
      return;
    }

    // Set profiling level to log slow operations
    // Level 1: Log slow operations only
    // Level 2: Log all operations (use with caution in production)
    const profilingLevel = process.env.MONGODB_PROFILING_LEVEL === '2' ? 2 : 1;
    
    await db.command({
      profile: profilingLevel,
      slowms: SLOW_QUERY_THRESHOLD_MS,
    });

    logger.info(`✅ MongoDB query profiling enabled (level ${profilingLevel}, threshold: ${SLOW_QUERY_THRESHOLD_MS}ms)`);
  } catch (error: any) {
    logger.warn('Could not enable MongoDB query profiling:', error.message);
  }
};

/**
 * Get slow queries from MongoDB profiler
 */
export const getSlowQueries = async (limit: number = 10) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return [];
    }

    const profilerCollection = db.collection('system.profile');
    const queries = await profilerCollection
      .find({})
      .sort({ ts: -1 })
      .limit(limit)
      .toArray();

    return queries.map((query: any) => ({
      operation: query.op,
      collection: query.ns?.split('.')[1] || 'unknown',
      duration: query.millis,
      timestamp: query.ts,
      query: query.command,
    }));
  } catch (error: any) {
    logger.debug('Could not retrieve slow queries from profiler:', error.message);
    return slowQueries.slice(-limit);
  }
};

/**
 * Log slow query manually (for queries not caught by profiler)
 */
export const logSlowQuery = (operation: string, collection: string, duration: number, query?: any) => {
  if (duration > SLOW_QUERY_THRESHOLD_MS) {
    slowQueries.push({
      operation,
      collection,
      duration,
      timestamp: new Date(),
      query,
    });

    logger.warn(`Slow query detected: ${operation} on ${collection} - ${duration}ms`);
    
    // Keep only last 100 slow queries in memory
    if (slowQueries.length > 100) {
      slowQueries.shift();
    }
  }
};

/**
 * Get query performance statistics
 */
export const getQueryStats = () => {
  if (slowQueries.length === 0) {
    return {
      totalSlowQueries: 0,
      averageDuration: 0,
      maxDuration: 0,
      slowestCollection: null,
    };
  }

  const totalDuration = slowQueries.reduce((sum, q) => sum + q.duration, 0);
  const averageDuration = totalDuration / slowQueries.length;
  const maxDuration = Math.max(...slowQueries.map(q => q.duration));
  
  // Find collection with most slow queries
  const collectionCounts: { [key: string]: number } = {};
  slowQueries.forEach(q => {
    collectionCounts[q.collection] = (collectionCounts[q.collection] || 0) + 1;
  });
  const slowestCollection = Object.entries(collectionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

  return {
    totalSlowQueries: slowQueries.length,
    averageDuration: Math.round(averageDuration),
    maxDuration,
    slowestCollection,
  };
};


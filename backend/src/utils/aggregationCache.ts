import { cache, cacheKeys } from './cache';
import logger from './logger';
import crypto from 'crypto';

/**
 * Generate a cache key for aggregation queries
 * Creates a deterministic hash from the aggregation pipeline
 */
const generateAggregationKey = (collection: string, pipeline: any[], suffix?: string): string => {
  const pipelineStr = JSON.stringify(pipeline);
  const hash = crypto.createHash('md5').update(pipelineStr).digest('hex').substring(0, 12);
  return `agg:${collection}:${hash}${suffix ? `:${suffix}` : ''}`;
};

/**
 * Cache aggregation result with TTL
 * @param collection Collection name (e.g., 'products', 'reviews', 'orders')
 * @param pipeline Aggregation pipeline
 * @param ttlSeconds Cache TTL in seconds (default: 5 minutes)
 * @param suffix Optional suffix for cache key (e.g., productId, date range)
 */
export const getCachedAggregation = async <T>(
  collection: string,
  pipeline: any[],
  ttlSeconds: number = 300, // 5 minutes default
  suffix?: string
): Promise<T | null> => {
  try {
    const cacheKey = generateAggregationKey(collection, pipeline, suffix);
    const cached = await cache.get<T>(cacheKey);
    
    if (cached) {
      logger.debug(`Aggregation cache HIT: ${cacheKey}`);
      return cached;
    }
    
    return null;
  } catch (error: any) {
    logger.error(`Error getting cached aggregation: ${error.message}`);
    return null;
  }
};

/**
 * Set aggregation result in cache
 */
export const setCachedAggregation = async <T>(
  collection: string,
  pipeline: any[],
  result: T,
  ttlSeconds: number = 300,
  suffix?: string
): Promise<void> => {
  try {
    const cacheKey = generateAggregationKey(collection, pipeline, suffix);
    await cache.set(cacheKey, result, ttlSeconds);
    logger.debug(`Aggregation cache SET: ${cacheKey} (TTL: ${ttlSeconds}s)`);
  } catch (error: any) {
    logger.error(`Error setting cached aggregation: ${error.message}`);
  }
};

/**
 * Execute aggregation with caching
 * @param collection Collection name
 * @param pipeline Aggregation pipeline
 * @param executeFn Function to execute the aggregation if not cached
 * @param ttlSeconds Cache TTL in seconds
 * @param suffix Optional suffix for cache key
 */
export const executeCachedAggregation = async <T>(
  collection: string,
  pipeline: any[],
  executeFn: () => Promise<T>,
  ttlSeconds: number = 300,
  suffix?: string
): Promise<T> => {
  // Try to get from cache
  const cached = await getCachedAggregation<T>(collection, pipeline, ttlSeconds, suffix);
  if (cached !== null) {
    return cached;
  }

  // Execute aggregation
  const result = await executeFn();

  // Cache the result
  await setCachedAggregation(collection, pipeline, result, ttlSeconds, suffix);

  return result;
};

/**
 * Invalidate aggregation cache for a collection
 * Useful when data changes (e.g., product updated, review added)
 */
export const invalidateAggregationCache = async (
  collection: string,
  pattern?: string
): Promise<void> => {
  try {
    const cachePattern = pattern || `agg:${collection}:*`;
    await cache.delPattern(cachePattern);
    logger.debug(`Invalidated aggregation cache: ${cachePattern}`);
  } catch (error: any) {
    logger.error(`Error invalidating aggregation cache: ${error.message}`);
  }
};


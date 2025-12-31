/**
 * Redis Store for express-rate-limit
 * Implements a custom store using the existing Redis client
 * This enables distributed rate limiting across multiple instances
 */

import type { Store } from 'express-rate-limit';
import { getRedisClient } from './cache';
import logger from './logger';
import type Redis from 'ioredis';

interface RedisRateLimitStoreOptions {
  prefix?: string;
}

/**
 * Custom Redis store for express-rate-limit
 * Implements the Store interface required by express-rate-limit v7
 */
export class RedisRateLimitStore implements Store {
  private prefix: string;
  private redisClient: Redis | null;
  private windowMs: number;

  constructor(options: RedisRateLimitStoreOptions & { windowMs?: number } = {}) {
    this.prefix = options.prefix || 'rl:';
    this.windowMs = options.windowMs || 900000; // Default 15 minutes
    this.redisClient = getRedisClient();
    
    if (!this.redisClient) {
      logger.warn('RedisRateLimitStore: Redis client not available, store will not function');
    }
  }

  /**
   * Increment the counter for a given key
   */
  async increment(key: string): Promise<{ totalHits: number; resetTime: Date | undefined }> {
    if (!this.redisClient) {
      // Fallback: return a value that won't trigger rate limit
      return { totalHits: 0, resetTime: undefined };
    }

    try {
      const redisKey = `${this.prefix}${key}`;
      
      // Use INCR to atomically increment
      const totalHits = await this.redisClient.incr(redisKey);
      
      // Set expiration on first increment (only if key is new)
      if (totalHits === 1) {
        const ttlSeconds = Math.ceil(this.windowMs / 1000);
        await this.redisClient.expire(redisKey, ttlSeconds);
      }
      
      // Get TTL to calculate reset time
      const ttl = await this.redisClient.ttl(redisKey);
      const resetTime = ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined;
      
      return { totalHits, resetTime };
    } catch (error) {
      logger.error('RedisRateLimitStore: Error incrementing key:', error);
      // Fallback: return a value that won't trigger rate limit
      return { totalHits: 0, resetTime: undefined };
    }
  }

  /**
   * Decrement the counter for a given key (used when skipSuccessfulRequests is true)
   */
  async decrement(key: string): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const redisKey = `${this.prefix}${key}`;
      await this.redisClient.decr(redisKey);
    } catch (error) {
      logger.error('RedisRateLimitStore: Error decrementing key:', error);
    }
  }

  /**
   * Reset the counter for a given key
   */
  async resetKey(key: string): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const redisKey = `${this.prefix}${key}`;
      await this.redisClient.del(redisKey);
    } catch (error) {
      logger.error('RedisRateLimitStore: Error resetting key:', error);
    }
  }

  /**
   * Shutdown the store (cleanup)
   */
  shutdown(): void {
    // Redis client is managed by cache.ts, don't close it here
    logger.debug('RedisRateLimitStore: Shutdown called');
  }
}

/**
 * Create a Redis store for rate limiting
 * Returns undefined if Redis is not available (will use in-memory store)
 */
export const createRedisRateLimitStore = (windowMs?: number): Store | undefined => {
  const redisClient = getRedisClient();
  
  if (!redisClient) {
    return undefined;
  }

  try {
    // Test Redis connection asynchronously
    redisClient.ping().then(() => {
      logger.info('✅ Rate limiting: Using Redis store for distributed rate limiting');
    }).catch(() => {
      logger.warn('⚠️  Rate limiting: Redis connection failed, falling back to in-memory store');
    });

    return new RedisRateLimitStore({ prefix: 'rl:', windowMs });
  } catch (error) {
    logger.error('RedisRateLimitStore: Error creating store:', error);
    return undefined;
  }
};


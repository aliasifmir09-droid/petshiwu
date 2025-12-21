import Redis from 'ioredis';
import logger from './logger';
import { memoryCacheService } from './memoryCache';

// Redis client instance
let redisClient: Redis | null = null;

// Initialize Redis connection
export const initRedis = (): Redis | null => {
  try {
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true; // Reconnect on READONLY error
          }
          return false;
        }
      });

      redisClient.on('connect', () => {
        logger.info('✅ Redis connected successfully');
      });

      redisClient.on('error', (err) => {
        logger.error('❌ Redis connection error:', err.message);
        // Don't fail the app if Redis is unavailable
        redisClient = null;
      });

      redisClient.on('close', () => {
        logger.warn('⚠️  Redis connection closed');
      });

      return redisClient;
    } else {
      logger.warn('⚠️  REDIS_URL not set. Using in-memory cache (data lost on restart).');
      logger.info('💡 For production, use free Redis: Upstash (upstash.com) or Redis Cloud (redis.com/try-free)');
      return null;
    }
  } catch (error: any) {
    logger.error('❌ Error initializing Redis:', error.message);
    return null;
  }
};

// Get Redis client
export const getRedisClient = (): Redis | null => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

// Cache helper functions
// Automatically falls back to in-memory cache if Redis is not available
export const cache = {
  // Get cached value
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const client = getRedisClient();
      if (client) {
        // Use Redis if available
        const value = await client.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
        return null;
      } else {
        // Fallback to in-memory cache
        return await memoryCacheService.get<T>(key);
      }
    } catch (error: any) {
      logger.error(`Error getting cache key ${key}:`, error.message);
      // Fallback to memory cache on error
      return await memoryCacheService.get<T>(key);
    }
  },

  // Set cached value with expiration
  set: async (key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> => {
    try {
      const client = getRedisClient();
      if (client) {
        // Use Redis if available
        await client.setex(key, ttlSeconds, JSON.stringify(value));
        return true;
      } else {
        // Fallback to in-memory cache
        return await memoryCacheService.set(key, value, ttlSeconds);
      }
    } catch (error: any) {
      logger.error(`Error setting cache key ${key}:`, error.message);
      // Fallback to memory cache on error
      return await memoryCacheService.set(key, value, ttlSeconds);
    }
  },

  // Delete cached value
  del: async (key: string): Promise<boolean> => {
    try {
      const client = getRedisClient();
      if (client) {
        // Use Redis if available
        await client.del(key);
        return true;
      } else {
        // Fallback to in-memory cache
        return await memoryCacheService.del(key);
      }
    } catch (error: any) {
      logger.error(`Error deleting cache key ${key}:`, error.message);
      // Fallback to memory cache on error
      return await memoryCacheService.del(key);
    }
  },

  // Delete multiple keys by pattern
  delPattern: async (pattern: string): Promise<number> => {
    try {
      const client = getRedisClient();
      if (client) {
        // Use Redis if available
        const stream = client.scanStream({
          match: pattern,
          count: 100
        });

        let deleted = 0;
        stream.on('data', async (keys: string[]) => {
          if (keys.length > 0) {
            const count = await client.del(...keys);
            deleted += count;
          }
        });

        return new Promise((resolve) => {
          stream.on('end', () => resolve(deleted));
        });
      } else {
        // Fallback to in-memory cache
        return await memoryCacheService.delPattern(pattern);
      }
    } catch (error: any) {
      logger.error(`Error deleting cache pattern ${pattern}:`, error.message);
      // Fallback to memory cache on error
      return await memoryCacheService.delPattern(pattern);
    }
  },

  // Check if key exists
  exists: async (key: string): Promise<boolean> => {
    try {
      const client = getRedisClient();
      if (client) {
        // Use Redis if available
        const result = await client.exists(key);
        return result === 1;
      } else {
        // Fallback to in-memory cache
        return await memoryCacheService.exists(key);
      }
    } catch (error: any) {
      logger.error(`Error checking cache key ${key}:`, error.message);
      // Fallback to memory cache on error
      return await memoryCacheService.exists(key);
    }
  }
};

// Cache key generators
export const cacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (query: string) => `products:${query}`,
  category: (id: string) => `category:${id}`,
  categories: (petType?: string) => `categories:${petType || 'all'}`,
  categoryTree: (petType?: string) => `categoryTree:${petType || 'all'}`,
  user: (id: string) => `user:${id}`,
  brands: (query: string) => `brands:${query}`,
  recommendations: (productId: string) => `recommendations:${productId}`,
  search: (query: string) => `search:${query}`,
  blogs: (petType?: string, category?: string, page?: number, limit?: number, search?: string) => 
    `blogs:${petType || 'all'}:${category || 'all'}:${page || 1}:${limit || 10}:${search || ''}`,
  careGuides: (petType?: string, category?: string, page?: number, limit?: number, search?: string) => 
    `careGuides:${petType || 'all'}:${category || 'all'}:${page || 1}:${limit || 10}:${search || ''}`,
  careGuide: (slug: string) => `careGuide:${slug}`,
  careGuideCategories: (petType?: string) => `careGuideCategories:${petType || 'all'}`,
  faqs: (category?: string, petType?: string, search?: string) => 
    `faqs:${category || 'all'}:${petType || 'all'}:${search || ''}`,
  faqCategories: () => `faqCategories:all`,
  slideshow: (type: string) => `slideshow:${type}`
};

// Cache middleware for Express routes
export const cacheMiddleware = (ttlSeconds: number = 3600) => {
  return async (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = `route:${req.originalUrl || req.url}`;
      const cached = await cache.get(cacheKey);

      if (cached) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        return res.status(200).json(cached);
      }

      // Store original json method
      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        // Cache the response
        cache.set(cacheKey, data, ttlSeconds).catch(err => {
          logger.error('Error caching response:', err);
        });
        return originalJson(data);
      };

      next();
    } catch (error) {
      next();
    }
  };
};


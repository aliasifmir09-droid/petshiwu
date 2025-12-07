import logger from './logger';

// Simple in-memory cache using Map
class MemoryCache {
  private cache: Map<string, { value: any; expires: number }>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cache = new Map();
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug(`Memory cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set(key: string, value: any, ttlSeconds: number = 3600): boolean {
    try {
      const expires = Date.now() + (ttlSeconds * 1000);
      this.cache.set(key, { value, expires });
      return true;
    } catch (error: any) {
      logger.error(`Error setting memory cache key ${key}:`, error.message);
      return false;
    }
  }

  del(key: string): boolean {
    try {
      return this.cache.delete(key);
    } catch (error: any) {
      logger.error(`Error deleting memory cache key ${key}:`, error.message);
      return false;
    }
  }

  delPattern(pattern: string): number {
    try {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      let deleted = 0;
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          deleted++;
        }
      }
      return deleted;
    } catch (error: any) {
      logger.error(`Error deleting memory cache pattern ${pattern}:`, error.message);
      return 0;
    }
  }

  exists(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    // Check if expired
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Singleton instance
const memoryCache = new MemoryCache();

// Export cache interface (same as Redis cache)
export const memoryCacheService = {
  get: <T>(key: string): Promise<T | null> => {
    return Promise.resolve(memoryCache.get<T>(key));
  },

  set: (key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> => {
    return Promise.resolve(memoryCache.set(key, value, ttlSeconds));
  },

  del: (key: string): Promise<boolean> => {
    return Promise.resolve(memoryCache.del(key));
  },

  delPattern: (pattern: string): Promise<number> => {
    return Promise.resolve(memoryCache.delPattern(pattern));
  },

  exists: (key: string): Promise<boolean> => {
    return Promise.resolve(memoryCache.exists(key));
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  memoryCache.destroy();
});

process.on('SIGINT', () => {
  memoryCache.destroy();
});


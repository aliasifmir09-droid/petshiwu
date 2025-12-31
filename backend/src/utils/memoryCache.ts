import logger from './logger';

// PERFORMANCE FIX: Maximum cache size to prevent memory issues
const MAX_CACHE_SIZE = parseInt(process.env.MAX_MEMORY_CACHE_SIZE || '1000', 10); // Default: 1000 entries
const MAX_CACHE_SIZE_BYTES = parseInt(process.env.MAX_MEMORY_CACHE_SIZE_BYTES || '104857600', 10); // Default: 100MB

// Simple in-memory cache using Map with LRU eviction
class MemoryCache {
  private cache: Map<string, { value: any; expires: number; lastAccessed: number }>;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private accessOrder: string[]; // Track access order for LRU eviction

  constructor() {
    this.cache = new Map();
    this.accessOrder = [];
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    let cleaned = 0;
    let sizeBytes = 0;
    
    // First, remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
          this.accessOrder.splice(index, 1);
        }
        cleaned++;
      } else {
        // Estimate size (rough calculation)
        try {
          const entrySize = JSON.stringify(entry.value).length;
          sizeBytes += entrySize;
        } catch (e) {
          // If can't stringify, estimate 1KB
          sizeBytes += 1024;
        }
      }
    }
    
    // PERFORMANCE FIX: LRU eviction if cache exceeds size limits
    // Remove least recently used entries if cache is too large
    while (this.cache.size > MAX_CACHE_SIZE && this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift()!;
      if (this.cache.has(lruKey)) {
        this.cache.delete(lruKey);
        cleaned++;
      }
    }
    
    // Also check byte size limit (rough estimate)
    if (sizeBytes > MAX_CACHE_SIZE_BYTES && this.accessOrder.length > 0) {
      // Remove oldest entries until under limit
      while (sizeBytes > MAX_CACHE_SIZE_BYTES * 0.9 && this.accessOrder.length > 0) {
        const lruKey = this.accessOrder.shift()!;
        if (this.cache.has(lruKey)) {
          try {
            const entrySize = JSON.stringify(this.cache.get(lruKey)?.value || '').length;
            sizeBytes -= entrySize;
          } catch (e) {
            sizeBytes -= 1024; // Estimate
          }
          this.cache.delete(lruKey);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Memory cache cleanup: removed ${cleaned} expired/LRU entries (size: ${this.cache.size}/${MAX_CACHE_SIZE})`);
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
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      return null;
    }

    // PERFORMANCE FIX: Update access order for LRU eviction
    // Move to end (most recently used)
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
    entry.lastAccessed = Date.now();

    return entry.value as T;
  }

  set(key: string, value: any, ttlSeconds: number = 3600): boolean {
    try {
      // PERFORMANCE FIX: Check cache size before adding
      // If cache is full, evict least recently used entry
      if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(key)) {
        // Evict LRU entry
        if (this.accessOrder.length > 0) {
          const lruKey = this.accessOrder.shift()!;
          this.cache.delete(lruKey);
          logger.debug(`Memory cache: Evicted LRU entry ${lruKey} (cache full: ${this.cache.size}/${MAX_CACHE_SIZE})`);
        }
      }
      
      const expires = Date.now() + (ttlSeconds * 1000);
      const lastAccessed = Date.now();
      this.cache.set(key, { value, expires, lastAccessed });
      
      // Update access order
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
      
      return true;
    } catch (error: any) {
      logger.error(`Error setting memory cache key ${key}:`, error.message);
      return false;
    }
  }

  del(key: string): boolean {
    try {
      const deleted = this.cache.delete(key);
      // Remove from access order
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      return deleted;
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
    this.accessOrder = [];
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


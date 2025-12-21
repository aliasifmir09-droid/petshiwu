import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Generate ETag from response body
 */
const generateETag = (body: any): string => {
  try {
    const str = typeof body === 'string' ? body : JSON.stringify(body);
    return crypto.createHash('md5').update(str).digest('hex');
  } catch (error) {
    // Fallback to timestamp if serialization fails
    return crypto.createHash('md5').update(Date.now().toString()).digest('hex');
  }
};

/**
 * Set appropriate cache headers based on endpoint type
 * Implements browser/CDN caching with ETag support for conditional requests
 */
export const setCacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Only set cache headers for GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const url = req.path || req.url;
  
  // Set cache headers before response is sent
  // Static data (categories, pet types) - cache for 1 hour
  if (url.includes('/pet-types') || url.includes('/categories')) {
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
  }
  // Dynamic data (products) - cache for 5 minutes
  else if (url.includes('/products') && !url.includes('/orders')) {
    // Cache both listings and individual products
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
  }
  // Orders - shorter cache (more dynamic)
  else if (url.includes('/orders')) {
    res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minute
  }
  // User-specific data - no cache
  else if (url.includes('/auth/me') || url.includes('/wishlist') || url.includes('/users')) {
    res.setHeader('Cache-Control', 'private, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }
  // Blogs, FAQs, Care Guides - moderate cache
  else if (url.includes('/blogs') || url.includes('/faqs') || url.includes('/care-guides')) {
    res.setHeader('Cache-Control', 'public, max-age=600'); // 10 minutes
  }
  // Default: no cache for other endpoints
  else {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
  }
  
  // Store original json method to add ETag
  const originalJson = res.json.bind(res);
  
  // Intercept response to add ETag for endpoints that support it
  res.json = function (body: any) {
    // Add ETag for cacheable endpoints
    if (url.includes('/pet-types') || url.includes('/categories') || 
        (url.includes('/products') && !url.includes('/orders')) ||
        url.includes('/blogs') || url.includes('/faqs') || url.includes('/care-guides')) {
      const etag = generateETag(body);
      res.setHeader('ETag', `"${etag}"`);
      
      // Check if client has cached version (conditional request)
      const clientETag = req.headers['if-none-match'];
      if (clientETag === `"${etag}"`) {
        res.status(304).end(); // Not Modified
        return res;
      }
    }
    
    return originalJson(body);
  };
  
  next();
};


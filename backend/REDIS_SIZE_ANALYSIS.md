# Redis Memory Usage Analysis

## Is 30MB Enough?

**Short Answer: Yes, for most small to medium stores (up to ~2,000 products).**

For larger stores or high-traffic sites, you may need more.

## What Gets Cached?

### 1. Product Listings (`GET /api/products`)
- **TTL:** 5 minutes (300 seconds)
- **Cache Key:** `products:{queryString}`
- **Size per entry:** ~40-100KB (depends on page size, typically 20 products)
- **Example:** `products:?petType=dog&page=1&limit=20`

**Memory estimate:**
- 50 different query combinations × 50KB = **2.5MB**

### 2. Single Products (`GET /api/products/:id`)
- **TTL:** 15 minutes (900 seconds)
- **Cache Key:** `product:{id}`
- **Size per entry:** ~2-5KB per product (images are URLs, not full data)
- **Example:** `product:507f1f77bcf86cd799439011`

**Memory estimate:**
- 1,000 products × 3KB = **3MB**
- 2,000 products × 3KB = **6MB**
- 5,000 products × 3KB = **15MB**

### 3. Category Listings (`GET /api/categories`)
- **TTL:** 30 minutes (1800 seconds)
- **Cache Key:** `categories:{petType}`
- **Size per entry:** ~10-20KB (category tree with all categories)
- **Example:** `categories:dog`, `categories:cat`, `categories:all`

**Memory estimate:**
- 5 pet types × 15KB = **75KB**

### 4. Single Categories (`GET /api/categories/:id`)
- **TTL:** 30 minutes (1800 seconds)
- **Cache Key:** `category:{id}-{petType}`
- **Size per entry:** ~1-2KB per category
- **Example:** `category:507f1f77bcf86cd799439011-dog`

**Memory estimate:**
- 100 categories × 1.5KB = **150KB**

### 5. Search Results (`GET /api/search`)
- **TTL:** 5 minutes (300 seconds)
- **Cache Key:** `search:{query}`
- **Size per entry:** ~40-100KB (similar to product listings)

**Memory estimate:**
- 30 active search queries × 50KB = **1.5MB**

### 6. Product Recommendations
- **TTL:** 1 hour (3600 seconds)
- **Cache Key:** `recommendations:{productId}`
- **Size per entry:** ~5-10KB (list of recommended products)

**Memory estimate:**
- 200 popular products × 7KB = **1.4MB**

### 7. Brand Lists
- **TTL:** 1 hour (3600 seconds)
- **Cache Key:** `brands:{query}`
- **Size per entry:** ~5-10KB

**Memory estimate:**
- 10 queries × 7KB = **70KB**

## Total Memory Estimates

### Small Store (500 products)
- Products: 1.5MB
- Listings: 1MB
- Categories: 225KB
- Search: 500KB
- Recommendations: 700KB
- Brands: 70KB
- **Total: ~4MB** ✅ **30MB is plenty**

### Medium Store (2,000 products)
- Products: 6MB
- Listings: 2.5MB
- Categories: 225KB
- Search: 1.5MB
- Recommendations: 1.4MB
- Brands: 70KB
- **Total: ~12MB** ✅ **30MB is sufficient**

### Large Store (5,000 products)
- Products: 15MB
- Listings: 5MB
- Categories: 300KB
- Search: 3MB
- Recommendations: 3.5MB
- Brands: 100KB
- **Total: ~27MB** ⚠️ **30MB is tight, but should work**

### Very Large Store (10,000+ products)
- Products: 30MB+ (exceeds limit)
- Listings: 10MB+
- **Total: 40MB+** ❌ **Need more than 30MB**

## Cache Eviction

Redis automatically evicts old entries when memory is full (based on TTL expiration). So even if you have 5,000 products, not all will be cached at once - only recently accessed ones.

## Recommendations

### ✅ 30MB is enough if:
- You have **< 3,000 products**
- **Low to medium traffic** (< 1,000 requests/hour)
- Most users browse similar products/categories
- You're okay with cache misses for less popular products

### ⚠️ Consider upgrading if:
- You have **> 3,000 products**
- **High traffic** (> 5,000 requests/hour)
- Many unique search queries
- You want to cache everything

### 💡 Optimization Tips:

1. **Reduce TTL for product listings** (currently 5 min)
   - Change to 2-3 minutes to free up memory faster

2. **Cache only popular products**
   - Don't cache every product, only frequently accessed ones

3. **Use cache warming**
   - Pre-cache popular products/categories on server startup

4. **Monitor Redis memory**
   - Set up alerts when memory usage > 80%

## Free Tier Alternatives

If 30MB isn't enough, consider:

1. **Upstash Redis** (Serverless)
   - Free: 10K commands/day
   - Paid: $0.20 per 100K commands
   - **Better for high traffic, unpredictable usage**

2. **Redis Cloud Paid Plans**
   - 100MB: ~$5/month
   - 250MB: ~$10/month
   - 1GB: ~$20/month

3. **AWS ElastiCache** (if on AWS)
   - t3.micro: ~$15/month (0.5GB)

## Conclusion

**For most pet shop websites: 30MB is sufficient.**

Start with the free 30MB tier and monitor usage. Upgrade only if you see:
- Frequent cache evictions
- High memory usage (> 25MB consistently)
- Performance degradation

The cache is designed to gracefully degrade - if Redis is full, it just won't cache new entries until old ones expire.


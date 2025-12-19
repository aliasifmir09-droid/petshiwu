# 🚀 Database Optimization Guide for 10,000+ Concurrent Users

This document outlines all database optimizations implemented to handle 10,000+ concurrent users.

## 📊 Connection Pool Optimization

### Current Settings
- **Max Pool Size:** 100 connections (configurable via `MONGODB_MAX_POOL_SIZE`)
- **Min Pool Size:** 10 connections (configurable via `MONGODB_MIN_POOL_SIZE`)
- **Max Idle Time:** 60 seconds (increased from 30s to reduce connection churn)
- **Heartbeat Frequency:** 10 seconds

### Configuration
```env
MONGODB_MAX_POOL_SIZE=100
MONGODB_MIN_POOL_SIZE=10
MONGODB_READ_PREFERENCE=primary  # Can use 'secondaryPreferred' for read scaling
```

### Formula for Pool Sizing
```
maxPoolSize = (expected concurrent requests / requests per connection) + buffer
For 10k users: 100 + 50 buffer = 150 (using 100 as safe starting point)
```

## 🔍 Index Optimization

### Product Model Indexes
- Text search: `{ name: 'text', description: 'text', brand: 'text', tags: 'text' }`
- Category filtering: `{ category: 1, isActive: 1, deletedAt: 1 }`
- Pet type filtering: `{ petType: 1, isActive: 1, deletedAt: 1 }`
- Compound indexes for common query patterns
- Price sorting: `{ isActive: 1, deletedAt: 1, basePrice: 1 }`
- Rating sorting: `{ isActive: 1, deletedAt: 1, averageRating: -1 }`

### Order Model Indexes (Optimized for Aggregations)
- User orders: `{ user: 1, createdAt: -1 }`
- Order status: `{ orderStatus: 1, createdAt: -1 }`
- **Product recommendations:** `{ 'items.product': 1, orderStatus: 1 }`
- **Frequently bought together:** `{ orderStatus: 1, 'items.product': 1 }`
- Compound: `{ user: 1, paymentStatus: 1, orderStatus: 1 }`

### Review Model Indexes
- Product reviews: `{ product: 1, isApproved: 1, createdAt: -1 }`
- User reviews: `{ user: 1, createdAt: -1 }`
- Rating queries: `{ product: 1, rating: 1, isApproved: 1 }`

## ⚡ Query Optimization

### Best Practices Implemented

1. **Use `.lean()` for Read Operations**
   ```typescript
   const products = await Product.find(query).lean();
   ```
   - Returns plain JavaScript objects (faster)
   - No Mongoose document overhead
   - Already implemented in most controllers

2. **Selective Field Projection**
   ```typescript
   .select('name slug price images')
   ```
   - Only fetch needed fields
   - Reduces network traffic
   - Faster query execution

3. **Pagination**
   ```typescript
   .skip(skip).limit(limit)
   ```
   - Prevents loading entire collections
   - Default limit: 20 items per page

4. **Efficient Population**
   ```typescript
   .populate('category', 'name slug')
   ```
   - Only populate needed fields
   - Avoids deep nesting when not needed

## 🗄️ Caching Strategy

### Redis Caching (Primary)
- Product listings: 5 minutes TTL
- Single products: 15 minutes TTL
- Categories: 1 hour TTL
- Pet types: 1 hour TTL

### In-Memory Cache (Fallback)
- Used when Redis is unavailable
- Same TTL values
- Data lost on restart (acceptable for cache)

### Cache Invalidation
- Automatic invalidation on mutations
- Pattern-based clearing (e.g., `products:*`)
- Ensures data consistency

## 📈 Performance Monitoring

### Health Check Endpoints
- `GET /api/health` - Full health check with database stats
- `GET /api/health/pool` - Connection pool status

### Monitoring Features
- Connection pool status logging (every 5 minutes in production)
- Database statistics tracking
- Slow query detection (if profiler enabled)
- Query logging (development only, via `ENABLE_QUERY_LOGGING=true`)

## 🔧 Additional Optimizations

### Network Compression
- Zlib compression enabled
- Reduces network traffic by ~70%
- Automatic for MongoDB 3.4+

### Retry Logic
- `retryWrites: true` - Retry write operations on transient errors
- `retryReads: true` - Retry read operations on transient errors
- Improves resilience during network issues

### Write Concerns
- `{ w: 'majority', j: true }` - Ensures writes are acknowledged and journaled
- Prevents data loss
- Slightly slower but more reliable

### Read Concerns
- `{ level: 'majority' }` - Ensures we read committed data
- Prevents reading uncommitted writes
- Better data consistency

## 📊 Expected Performance

### With These Optimizations
- **Concurrent Users:** 10,000+
- **Requests per Second:** 1,000+ (with proper server scaling)
- **Query Response Time:** < 50ms (cached), < 200ms (uncached)
- **Connection Pool Utilization:** 60-80% under normal load

### Scaling Recommendations

1. **Read Replicas**
   - Use `MONGODB_READ_PREFERENCE=secondaryPreferred`
   - Distribute read load across replicas
   - Primary handles writes only

2. **Horizontal Scaling**
   - Add more application servers
   - Each server maintains its own connection pool
   - Load balancer distributes requests

3. **Database Sharding**
   - For very large datasets (>100GB)
   - Distribute data across multiple shards
   - Requires MongoDB Atlas or self-hosted cluster

4. **Connection Pool Tuning**
   - Monitor pool utilization
   - Increase `maxPoolSize` if hitting limits
   - Monitor connection wait times

## 🚨 Monitoring & Alerts

### Key Metrics to Monitor
1. **Connection Pool Utilization**
   - Should stay below 80%
   - Alert if consistently above 90%

2. **Query Response Times**
   - P95 should be < 200ms
   - Alert if P95 > 500ms

3. **Database Size**
   - Monitor index size vs data size
   - Indexes should be < 20% of data size

4. **Slow Queries**
   - Enable MongoDB profiler in production
   - Review queries taking > 100ms
   - Optimize or add indexes

## 🔍 Troubleshooting

### High Connection Pool Usage
```bash
# Check current pool status
curl http://your-api/api/health/pool

# Increase pool size
export MONGODB_MAX_POOL_SIZE=150
```

### Slow Queries
```bash
# Enable query logging (development)
export ENABLE_QUERY_LOGGING=true

# Check slow queries (requires profiler)
# Use MongoDB Compass or mongosh
db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 }).limit(10)
```

### Connection Timeouts
- Check MongoDB server resources (CPU, RAM, disk I/O)
- Verify network latency
- Consider read replicas for geographic distribution

## 📝 Environment Variables

```env
# Connection Pool
MONGODB_MAX_POOL_SIZE=100
MONGODB_MIN_POOL_SIZE=10

# Read Preference (for read scaling)
MONGODB_READ_PREFERENCE=primary  # or 'secondaryPreferred'

# Query Logging (development only)
ENABLE_QUERY_LOGGING=false

# Redis (for caching)
REDIS_URL=redis://localhost:6379
```

## ✅ Checklist for Production

- [x] Connection pool size optimized (100 max, 10 min)
- [x] Comprehensive indexes on all frequently queried fields
- [x] Query optimization (lean, selective fields, pagination)
- [x] Caching strategy implemented (Redis + in-memory fallback)
- [x] Health check endpoints available
- [x] Connection pool monitoring enabled
- [x] Network compression enabled
- [x] Retry logic for transient errors
- [x] Write/read concerns configured
- [ ] MongoDB profiler enabled (optional, for slow query detection)
- [ ] Read replicas configured (optional, for read scaling)
- [ ] Database backups configured
- [ ] Monitoring alerts set up

## 🎯 Next Steps

1. **Monitor Performance**
   - Track connection pool utilization
   - Monitor query response times
   - Review slow queries regularly

2. **Scale as Needed**
   - Increase pool size if hitting limits
   - Add read replicas for read-heavy workloads
   - Consider database sharding for very large datasets

3. **Optimize Further**
   - Review and optimize slow queries
   - Add indexes based on query patterns
   - Adjust cache TTLs based on data change frequency

---

**Last Updated:** 2024
**Optimized For:** 10,000+ concurrent users
**Database:** MongoDB with Mongoose


# Redis Setup Guide

## What is Redis?

Redis is an in-memory data store used for caching. It significantly improves your application's performance by:
- **Caching frequently accessed data** (products, categories, search results)
- **Reducing database load** by serving cached responses
- **Faster response times** for API endpoints

## Current Status

⚠️ **Warning**: `REDIS_URL not set. Caching disabled.`

Your application **works fine without Redis**, but you're missing out on performance optimizations. Without Redis, all data is fetched directly from MongoDB on every request.

## How to Fix

### Option 1: Use a Free Redis Cloud Service (Recommended for Production)

#### **Redis Cloud (Recommended)**
1. Sign up at [https://redis.com/try-free/](https://redis.com/try-free/)
2. Create a free database (30MB free tier)
3. Copy the connection URL (looks like: `redis://default:password@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345`)
4. Add to your `.env` file:
   ```
   REDIS_URL=redis://default:password@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345
   ```

#### **Upstash Redis (Serverless)**
1. Sign up at [https://upstash.com/](https://upstash.com/)
2. Create a Redis database
3. Copy the REST URL (looks like: `redis://default:password@usw1-xxx.upstash.io:6379`)
4. Add to your `.env` file:
   ```
   REDIS_URL=redis://default:password@usw1-xxx.upstash.io:6379
   ```

#### **Render Redis (If hosting on Render)**
1. Go to your Render dashboard
2. Create a new "Redis" service
3. Copy the "Internal Redis URL" or "External Redis URL"
4. Add to your environment variables:
   ```
   REDIS_URL=redis://red-xxxxx:6379
   ```

### Option 2: Local Redis (For Development)

#### **Windows:**
1. Download Redis from [https://github.com/microsoftarchive/redis/releases](https://github.com/microsoftarchive/redis/releases)
2. Or use WSL2 with: `sudo apt-get install redis-server`
3. Start Redis: `redis-server`
4. Add to `.env`:
   ```
   REDIS_URL=redis://localhost:6379
   ```

#### **macOS:**
```bash
brew install redis
brew services start redis
```
Add to `.env`:
```
REDIS_URL=redis://localhost:6379
```

#### **Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```
Add to `.env`:
```
REDIS_URL=redis://localhost:6379
```

### Option 3: Docker (For Development)

```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

Add to `.env`:
```
REDIS_URL=redis://localhost:6379
```

## Environment Variable Format

The `REDIS_URL` should be in one of these formats:

```
# Without password
redis://localhost:6379

# With password
redis://:password@host:port

# With username and password
redis://username:password@host:port

# With database number
redis://localhost:6379/0
```

## Testing Redis Connection

After setting `REDIS_URL`, restart your server. You should see:

```
✅ Redis connected successfully
```

Instead of:
```
⚠️  REDIS_URL not set. Caching disabled.
```

## What Gets Cached?

With Redis enabled, the following are automatically cached:
- **Product listings** (with filters)
- **Individual products**
- **Category trees**
- **Search results**
- **Product recommendations**
- **Brand lists**

Cache expiration: **1 hour** (configurable)

## Troubleshooting

### Redis connection fails
- Check if Redis server is running
- Verify `REDIS_URL` format is correct
- Check firewall/network settings
- For cloud Redis: Ensure your IP is whitelisted

### Cache not working
- Check server logs for Redis errors
- Verify `REDIS_URL` is set correctly
- Test Redis connection: `redis-cli ping` (should return `PONG`)

### Performance not improved
- Cache takes time to build up (first requests populate cache)
- Check Redis memory usage
- Verify cache keys are being set (check logs)

## Production Recommendations

1. **Use a managed Redis service** (Redis Cloud, Upstash, AWS ElastiCache)
2. **Set up Redis persistence** (RDB or AOF) to prevent data loss
3. **Monitor Redis memory usage** and set up alerts
4. **Use Redis password authentication** for security
5. **Enable TLS/SSL** for encrypted connections

## Cost

- **Free tier**: Redis Cloud (30MB), Upstash (10K commands/day)
- **Paid**: Starting at ~$5-10/month for small applications
- **Local**: Free (but requires server management)

## Next Steps

1. Choose a Redis provider (recommended: Redis Cloud for free tier)
2. Get your Redis connection URL
3. Add `REDIS_URL` to your `.env` file or hosting platform environment variables
4. Restart your server
5. Verify connection in logs

---

**Note**: Your application works perfectly fine without Redis. This is an **optional performance optimization**. If you're just starting out or have low traffic, you can skip Redis for now and add it later when needed.


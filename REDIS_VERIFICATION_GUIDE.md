# How to Verify Redis is Working in Production

This guide shows you how to confirm that Redis is properly connected and working in your production environment.

## Quick Verification Methods

### Method 1: Check Health Endpoint (Easiest) ⭐

**Endpoint:** `GET /api/health/redis`

**Using curl:**
```bash
curl https://your-backend-url.com/api/health/redis
```

**Expected Response (Redis Working):**
```json
{
  "success": true,
  "available": true,
  "connected": true,
  "configured": true,
  "info": {
    "version": "7.2.0",
    "usedMemory": "2.5M",
    "connectedClients": 1
  },
  "timestamp": "2024-12-20T12:00:00.000Z"
}
```

**Expected Response (Redis Not Working):**
```json
{
  "success": false,
  "available": false,
  "connected": false,
  "configured": true,
  "error": "Connection test failed",
  "timestamp": "2024-12-20T12:00:00.000Z"
}
```

**Expected Response (Redis Not Configured):**
```json
{
  "success": false,
  "available": false,
  "connected": false,
  "configured": false,
  "error": "REDIS_URL not configured",
  "timestamp": "2024-12-20T12:00:00.000Z"
}
```

---

### Method 2: Check General Health Endpoint

**Endpoint:** `GET /api/health`

**Using curl:**
```bash
curl https://your-backend-url.com/api/health
```

**Response includes Redis status:**
```json
{
  "status": "healthy",
  "database": {
    "healthy": true,
    "responseTime": 5
  },
  "redis": {
    "available": true,
    "connected": true,
    "configured": true,
    "info": {
      "version": "7.2.0",
      "usedMemory": "2.5M",
      "connectedClients": 1
    }
  },
  "timestamp": "2024-12-20T12:00:00.000Z"
}
```

---

### Method 3: Check Server Logs

When your server starts, look for these log messages:

**✅ Redis Working:**
```
✅ Redis connected successfully
```

**❌ Redis Not Working:**
```
❌ Redis connection error: [error message]
⚠️  REDIS_URL not set. Using in-memory cache (data lost on restart).
```

**Where to find logs:**
- **Render.com:** Dashboard → Your Service → Logs
- **Railway:** Dashboard → Your Service → Deployments → View Logs
- **Heroku:** `heroku logs --tail`
- **Local:** Terminal where you ran `npm run dev`

---

### Method 4: Test Cache Operations

Make API requests and check if caching is working:

1. **First Request** (should be slow - no cache):
   ```bash
   curl https://your-backend-url.com/api/products?featured=true
   ```
   - Check response time (should be normal)

2. **Second Request** (should be fast - from cache):
   ```bash
   curl https://your-backend-url.com/api/products?featured=true
   ```
   - Check response time (should be faster if Redis is working)

3. **Check Cache Headers:**
   Look for `X-Cache` or `ETag` headers in the response.

---

### Method 5: Check Your Redis Provider Dashboard

#### Upstash
1. Go to https://console.upstash.com/
2. Select your Redis database
3. Check **Metrics** tab:
   - **Commands:** Should show activity
   - **Memory:** Should show usage
   - **Connections:** Should show active connections

#### Redis Cloud
1. Go to https://redis.com/redis-enterprise-cloud/
2. Select your database
3. Check **Metrics**:
   - **Ops/sec:** Should show operations
   - **Memory:** Should show usage
   - **Connections:** Should show active connections

---

## Step-by-Step Verification

### Step 1: Verify Environment Variable

**In Production (Render.com, Railway, etc.):**
1. Go to your service dashboard
2. Navigate to **Environment Variables** or **Settings → Environment**
3. Verify `REDIS_URL` is set:
   ```
   REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379
   ```

**Important:** Make sure there are no extra spaces or quotes around the URL.

---

### Step 2: Check Server Startup Logs

After deploying, check your server logs for:

**✅ Success:**
```
✅ Redis connected successfully
```

**❌ Failure:**
```
❌ Redis connection error: ECONNREFUSED
❌ Redis connection error: Authentication failed
```

---

### Step 3: Test Redis Endpoint

**Using Browser:**
```
https://your-backend-url.com/api/health/redis
```

**Using curl:**
```bash
curl https://your-backend-url.com/api/health/redis
```

**Using Postman/Insomnia:**
- Method: `GET`
- URL: `https://your-backend-url.com/api/health/redis`

---

### Step 4: Verify Cache is Working

1. **Make a product API call:**
   ```bash
   curl https://your-backend-url.com/api/products?featured=true
   ```

2. **Check response time:**
   - First call: Normal response time
   - Second call (within cache TTL): Should be faster

3. **Check logs for cache operations:**
   ```
   Cache HIT: products:featured=true
   ```

---

## Common Issues and Solutions

### Issue 1: "REDIS_URL not configured"

**Problem:** Environment variable not set

**Solution:**
1. Go to your hosting provider dashboard
2. Add `REDIS_URL` environment variable
3. Restart your service

---

### Issue 2: "Connection test failed" or "ECONNREFUSED"

**Problem:** Cannot connect to Redis server

**Solutions:**
1. **Check Redis URL format:**
   - Should be: `rediss://default:PASSWORD@ENDPOINT:6379`
   - No extra spaces or quotes

2. **Check if Redis is running:**
   - Go to your Redis provider dashboard
   - Verify database is active

3. **Check network/firewall:**
   - Ensure your server can reach Redis endpoint
   - For some providers, you may need to whitelist IPs

4. **Check credentials:**
   - Verify password is correct
   - Check if password has special characters (may need URL encoding)

---

### Issue 3: "Authentication failed"

**Problem:** Wrong password or username

**Solution:**
1. Go to Redis provider dashboard
2. Regenerate password if needed
3. Update `REDIS_URL` with correct credentials
4. Restart service

---

### Issue 4: Redis shows as "not connected" but app works

**Problem:** App is using in-memory cache fallback

**Solution:**
1. Check if `REDIS_URL` is correctly set
2. Check server logs for connection errors
3. Verify Redis endpoint is accessible from your server
4. Test connection manually using `redis-cli` or provider's console

---

## Testing Redis Connection Manually

### Using Redis Provider Console

**Upstash:**
1. Go to console.upstash.com
2. Select your database
3. Click "Console" tab
4. Run: `PING`
5. Should return: `PONG`

**Redis Cloud:**
1. Go to your database dashboard
2. Use the built-in Redis CLI
3. Run: `PING`
4. Should return: `PONG`

---

### Using redis-cli (Local Testing)

If you have `redis-cli` installed:

```bash
# Connect to your Redis
redis-cli -u "rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379"

# Test connection
PING
# Should return: PONG

# Check info
INFO server
INFO memory
```

---

## Production Checklist

- [ ] `REDIS_URL` environment variable is set in production
- [ ] Server logs show "✅ Redis connected successfully"
- [ ] `/api/health/redis` endpoint returns `"connected": true`
- [ ] Redis provider dashboard shows active connections
- [ ] Cache operations are working (faster response times on repeated requests)
- [ ] No Redis connection errors in server logs

---

## Monitoring Redis in Production

### Key Metrics to Watch

1. **Connection Status:** Should always be `connected: true`
2. **Memory Usage:** Monitor to avoid hitting limits
3. **Command Count:** Track usage (especially for free tiers)
4. **Response Times:** Cache should improve API response times

### Set Up Alerts

Most Redis providers offer:
- **Upstash:** Email alerts for usage limits
- **Redis Cloud:** Monitoring dashboard with alerts

---

## Quick Test Script

Save this as `test-redis.sh`:

```bash
#!/bin/bash

BACKEND_URL="https://your-backend-url.com"

echo "Testing Redis connection..."
echo ""

# Test Redis health endpoint
curl -s "$BACKEND_URL/api/health/redis" | jq '.'

echo ""
echo "Testing general health (includes Redis)..."
curl -s "$BACKEND_URL/api/health" | jq '.redis'
```

Run it:
```bash
chmod +x test-redis.sh
./test-redis.sh
```

---

## Summary

**Quickest way to verify:**
```bash
curl https://your-backend-url.com/api/health/redis
```

**Look for:**
- `"connected": true` ✅ Redis is working
- `"connected": false` ❌ Redis is not working (check error message)

**If Redis is not working:**
1. Check `REDIS_URL` environment variable
2. Check server logs for connection errors
3. Verify Redis is active in provider dashboard
4. Test connection manually

---

**Note:** The application works fine without Redis (uses in-memory cache), but Redis provides better performance and persistence across server restarts.


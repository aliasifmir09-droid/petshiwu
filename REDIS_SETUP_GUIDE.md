# Redis Setup Guide

This guide explains how to get a Redis URL and configure it for the petshiwu e-commerce platform.

## Overview

Redis is used for caching to improve performance. The application works without Redis (uses in-memory cache), but Redis is recommended for production.

## How to Get a Redis URL

### Option 1: Upstash (Recommended - Free Tier Available) ⭐

**Best for:** Production deployments, free tier available

1. **Sign up at [Upstash.com](https://upstash.com/)**
   - Go to https://upstash.com/
   - Click "Sign Up" (free account available)

2. **Create a Redis Database**
   - After login, click "Create Database"
   - Choose:
     - **Type:** Regional (recommended) or Global
     - **Region:** Choose closest to your server (e.g., `us-east-1`)
     - **Name:** `petshiwu-cache` (or any name)
   - Click "Create"

3. **Get Your Redis URL**
   - After creation, you'll see your database details
   - Copy the **REST URL** or **Redis URL**
   - Format: `rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379`
   - Or: `redis://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379`

4. **Add to `.env` file:**
   ```env
   REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379
   ```

**Free Tier Limits:**
- 10,000 commands/day
- 256 MB storage
- Perfect for small to medium applications

---

### Option 2: Redis Cloud (Free Tier Available)

**Best for:** Production, managed Redis

1. **Sign up at [Redis Cloud](https://redis.com/try-free/)**
   - Go to https://redis.com/try-free/
   - Click "Try Free"

2. **Create a Subscription**
   - Choose "Free" plan
   - Select your cloud provider (AWS, GCP, Azure)
   - Choose region

3. **Create a Database**
   - Click "New Database"
   - Configure:
     - **Name:** `petshiwu-cache`
     - **Memory:** 30MB (free tier)
   - Click "Activate"

4. **Get Your Redis URL**
   - Go to your database details
   - Copy the **Public endpoint** or **Connection string**
   - Format: `redis://default:YOUR_PASSWORD@YOUR_ENDPOINT:PORT`

5. **Add to `.env` file:**
   ```env
   REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_ENDPOINT:PORT
   ```

**Free Tier Limits:**
- 30 MB storage
- Good for development and small production apps

---

### Option 3: Local Redis (Development)

**Best for:** Local development and testing

#### Windows (Using Docker - Recommended)

1. **Install Docker Desktop** (if not installed)
   - Download from https://www.docker.com/products/docker-desktop

2. **Run Redis Container:**
   ```bash
   docker run -d --name redis -p 6379:6379 redis:7-alpine
   ```

3. **Get Redis URL:**
   ```env
   REDIS_URL=redis://localhost:6379
   ```

#### macOS/Linux

1. **Install Redis:**
   ```bash
   # macOS (using Homebrew)
   brew install redis
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install redis-server
   ```

2. **Start Redis:**
   ```bash
   # macOS
   brew services start redis
   
   # Linux
   sudo systemctl start redis
   ```

3. **Get Redis URL:**
   ```env
   REDIS_URL=redis://localhost:6379
   ```

---

### Option 4: Render.com (If Deploying on Render)

**Best for:** If your backend is hosted on Render

1. **Go to Render Dashboard**
   - https://dashboard.render.com/

2. **Create New Redis Instance**
   - Click "New +" → "Redis"
   - Configure:
     - **Name:** `petshiwu-redis`
     - **Plan:** Free tier available
     - **Region:** Same as your backend

3. **Get Connection String**
   - After creation, go to Redis instance
   - Copy the **Internal Redis URL** or **External Redis URL**
   - Format: `redis://red-xxxxx:6379` or `rediss://red-xxxxx:6379`

4. **Add to Environment Variables:**
   - In your Render backend service settings
   - Add environment variable: `REDIS_URL=redis://red-xxxxx:6379`

---

### Option 5: Railway (If Deploying on Railway)

1. **Go to Railway Dashboard**
   - https://railway.app/

2. **Create Redis Service**
   - Click "New" → "Database" → "Add Redis"
   - Railway automatically provides connection string

3. **Get Connection String**
   - Go to Redis service → "Variables" tab
   - Copy `REDIS_URL` value

4. **Add to Backend Service**
   - Link Redis to your backend service
   - Or manually add `REDIS_URL` environment variable

---

## Configuration

### Step 1: Add Redis URL to Environment Variables

Create or edit `backend/.env` file:

```env
# Redis Configuration (Optional - app works without it)
REDIS_URL=redis://localhost:6379

# For production with password:
# REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379

# For Upstash:
# REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
```

### Step 2: Test Redis Connection

Start your backend server:

```bash
cd backend
npm run dev
```

Look for these log messages:
- ✅ `Redis connected successfully` - Redis is working
- ⚠️ `REDIS_URL not set. Using in-memory cache` - Redis not configured (app still works)

### Step 3: Verify Redis is Working

Check server logs when making API requests. If Redis is working, you'll see cache operations in the logs.

---

## Redis URL Formats

### Standard Format
```
redis://[username]:[password]@[host]:[port]
```

### Examples

**Local (no password):**
```
redis://localhost:6379
```

**Upstash:**
```
rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
```

**Redis Cloud:**
```
redis://default:YOUR_PASSWORD@YOUR_ENDPOINT.redis.cloud:12345
```

**With Username:**
```
redis://myuser:mypassword@redis.example.com:6379
```

**Note:** `rediss://` (with double 's') indicates SSL/TLS encrypted connection (recommended for production).

---

## Quick Setup Commands

### Upstash (Recommended)
1. Sign up: https://upstash.com/
2. Create database
3. Copy Redis URL
4. Add to `.env`: `REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379`

### Local Development (Docker)
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```
Then in `.env`: `REDIS_URL=redis://localhost:6379`

---

## Troubleshooting

### Redis Connection Failed

**Error:** `Redis connection error: ECONNREFUSED`

**Solutions:**
1. Check if Redis is running: `docker ps` (for Docker) or `redis-cli ping`
2. Verify Redis URL format is correct
3. Check firewall/network settings
4. For cloud Redis, ensure your IP is whitelisted (if required)

### Redis URL Not Working

**Check:**
1. URL format is correct (no extra spaces)
2. Password is correct (if required)
3. Port is correct (default: 6379)
4. Host/endpoint is correct

### App Works Without Redis

**This is normal!** The application automatically falls back to in-memory cache if Redis is unavailable. You'll see:
```
⚠️  REDIS_URL not set. Using in-memory cache (data lost on restart).
```

---

## Production Recommendations

1. **Use Upstash or Redis Cloud** for managed Redis
2. **Use SSL/TLS** (`rediss://`) for secure connections
3. **Set up monitoring** for Redis usage
4. **Configure backups** if available
5. **Use connection pooling** (already configured in code)

---

## Cost Comparison

| Provider | Free Tier | Paid Plans Start At |
|----------|----------|---------------------|
| **Upstash** | 10K commands/day, 256MB | $0.20/100K commands |
| **Redis Cloud** | 30MB storage | $0.034/hour (~$25/month) |
| **Local** | Free | Free (your server) |

**Recommendation:** Start with Upstash free tier for production.

---

## Need Help?

- **Upstash Docs:** https://docs.upstash.com/redis
- **Redis Cloud Docs:** https://docs.redis.com/
- **Redis Commands:** https://redis.io/commands/

---

**Note:** Redis is optional. The application works perfectly fine without it, using in-memory caching instead.


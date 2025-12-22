# CORS and 503 Service Unavailable Troubleshooting Guide

## Understanding the Errors

### Error 1: CORS Policy Error
```
Access to XMLHttpRequest at 'https://pet-shop-backend-totp.onrender.com/api/pet-types' 
from origin 'https://www.petshiwu.com' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**What this means:**
- The browser is blocking the request because the backend isn't sending the correct CORS headers
- This usually happens when the server returns a 503 error (see below) or CORS is misconfigured

### Error 2: 503 Service Unavailable
```
GET https://pet-shop-backend-totp.onrender.com/api/pet-types net::ERR_FAILED 503 (Service Unavailable)
```

**What this means:**
- The server is not responding or is down
- On Render.com free tier, servers spin down after 15 minutes of inactivity
- The server might be starting up (cold start takes 30-60 seconds)
- Database connection might be failing

---

## Root Cause Analysis

The **503 error is the primary issue**. When a server returns 503:
1. It doesn't send CORS headers (because the request fails before CORS middleware runs)
2. The browser shows a CORS error as a secondary symptom
3. The actual problem is the server not responding

---

## Solutions

### Solution 1: Check if Server is Running

**Quick Test:**
```bash
curl https://pet-shop-backend-totp.onrender.com/api/health/ping
```

**Expected Response (Server Running):**
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2024-12-20T12:00:00.000Z"
}
```

**If you get 503 or connection refused:**
- Server is down or starting up
- Wait 30-60 seconds and try again (cold start on Render.com)
- Check Render.com dashboard for service status

---

### Solution 2: Verify CORS Configuration

The backend is configured to allow:
- ✅ `https://www.petshiwu.com`
- ✅ `https://petshiwu.com`
- ✅ All `*.petshiwu.com` subdomains
- ✅ All `*.onrender.com` subdomains

**Check CORS in Backend Logs:**
Look for these log messages:
```
CORS: Allowing origin: https://www.petshiwu.com
```

If you see:
```
CORS: Blocking unauthorized origin: https://www.petshiwu.com
```

Then CORS is blocking the request. Check:
1. Environment variables are set correctly
2. Backend code is deployed with latest changes
3. No trailing slashes in origin URLs

---

### Solution 3: Render.com Free Tier Cold Starts

**Problem:**
- Render.com free tier spins down services after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- During cold start, requests return 503

**Solutions:**

**Option A: Keep Server Warm (Recommended)**
1. Set up a monitoring service (UptimeRobot, Pingdom, etc.)
2. Ping `/api/health/ping` every 5-10 minutes
3. This prevents the server from spinning down

**Option B: Upgrade to Paid Tier**
- Render.com paid tier keeps services always running
- No cold starts
- Better for production

**Option C: Accept Cold Starts**
- First user after inactivity will wait 30-60 seconds
- Subsequent requests are fast
- Add loading indicators for better UX

---

### Solution 4: Check Database Connection

**Test Database Health:**
```bash
curl https://pet-shop-backend-totp.onrender.com/api/health
```

**If Database is Down:**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "timestamp": "2024-12-20T12:00:00.000Z"
}
```

**Fix:**
1. Check MongoDB connection string in environment variables
2. Verify MongoDB Atlas cluster is running
3. Check IP whitelist in MongoDB Atlas (should allow all IPs: `0.0.0.0/0`)

---

### Solution 5: Check Environment Variables

**Required Variables:**
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string (optional)
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend URL (optional, defaults used)
- `NODE_ENV` - Should be `production` in production

**Verify in Render.com:**
1. Go to Dashboard → Your Service → Environment
2. Check all required variables are set
3. Ensure no typos or extra spaces

---

## Step-by-Step Troubleshooting

### Step 1: Test Server Availability

```bash
# Test simple ping endpoint (no database required)
curl https://pet-shop-backend-totp.onrender.com/api/health/ping
```

**If this fails:**
- Server is down or starting up
- Wait 30-60 seconds and retry
- Check Render.com dashboard

---

### Step 2: Test Full Health Check

```bash
# Test full health (requires database)
curl https://pet-shop-backend-totp.onrender.com/api/health
```

**If database is disconnected:**
- Check MongoDB connection
- Verify environment variables
- Check MongoDB Atlas status

---

### Step 3: Test CORS Directly

```bash
# Test CORS with OPTIONS request
curl -X OPTIONS https://pet-shop-backend-totp.onrender.com/api/pet-types \
  -H "Origin: https://www.petshiwu.com" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

**Look for:**
```
< Access-Control-Allow-Origin: https://www.petshiwu.com
< Access-Control-Allow-Credentials: true
```

**If missing:**
- CORS middleware not running
- Server returning error before CORS
- Check backend logs

---

### Step 4: Check Backend Logs

**In Render.com Dashboard:**
1. Go to your service
2. Click "Logs" tab
3. Look for:
   - `✅ Server is ready to accept connections`
   - `✅ Redis connected successfully`
   - `✅ MongoDB connected`
   - `CORS: Allowing origin: https://www.petshiwu.com`

**Error Messages to Look For:**
- `❌ MongoDB connection error` - Database issue
- `❌ Redis connection error` - Redis issue (non-critical)
- `CORS: Blocking unauthorized origin` - CORS configuration issue
- `❌ Server error` - Server crash

---

## Quick Fixes

### Fix 1: Restart Server
1. Go to Render.com dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for deployment to complete (2-5 minutes)

### Fix 2: Verify CORS Configuration
The backend code includes:
```typescript
const allowedOrigins = [
  'https://www.petshiwu.com',
  'https://petshiwu.com',
  // ... other origins
];

// Also allows any origin containing 'petshiwu.com'
origin?.includes('petshiwu.com')
```

**If still blocked:**
- Check backend is deployed with latest code
- Verify no trailing slashes in origin
- Check environment variables

### Fix 3: Add Keep-Alive Service
Use a free service like UptimeRobot:
1. Sign up at https://uptimerobot.com
2. Add monitor:
   - URL: `https://pet-shop-backend-totp.onrender.com/api/health/ping`
   - Interval: 5 minutes
3. This keeps server warm

---

## Monitoring and Prevention

### Set Up Monitoring

**Option 1: UptimeRobot (Free)**
- Monitors server every 5 minutes
- Keeps server warm
- Alerts on downtime

**Option 2: Render.com Built-in**
- Go to Dashboard → Your Service → Settings
- Enable "Auto-Deploy" and monitoring

### Add Health Check Endpoint

The backend now includes:
- `/api/health/ping` - Simple check (no database)
- `/api/health` - Full health check (with database)
- `/api/health/redis` - Redis status

Use `/api/health/ping` for keep-alive pings.

---

## Common Scenarios

### Scenario 1: First Request After Inactivity
**Symptom:** 503 error, then works fine
**Cause:** Render.com cold start
**Solution:** Set up keep-alive service

### Scenario 2: Database Connection Lost
**Symptom:** 503 error, health check shows "database: disconnected"
**Cause:** MongoDB connection issue
**Solution:** Check MongoDB Atlas, connection string, IP whitelist

### Scenario 3: CORS Error Only
**Symptom:** CORS error but server responds
**Cause:** Origin not in allowed list
**Solution:** Verify `https://www.petshiwu.com` is in allowed origins

### Scenario 4: Server Crashed
**Symptom:** 503 error, no response
**Cause:** Application error, unhandled exception
**Solution:** Check logs, fix error, redeploy

---

## Testing Checklist

- [ ] Server responds to `/api/health/ping`
- [ ] Server responds to `/api/health`
- [ ] Database is connected (health check shows "healthy")
- [ ] CORS headers are present in OPTIONS requests
- [ ] Frontend can make requests from `https://www.petshiwu.com`
- [ ] No errors in backend logs
- [ ] Environment variables are set correctly

---

## Summary

**Primary Issue:** 503 Service Unavailable (server not responding)
**Secondary Issue:** CORS error (symptom of 503)

**Quick Fix:**
1. Wait 30-60 seconds (cold start)
2. Test `/api/health/ping` endpoint
3. Check backend logs in Render.com
4. Verify environment variables
5. Set up keep-alive service to prevent cold starts

**Long-term Solution:**
- Set up monitoring/keep-alive service
- Consider upgrading to paid Render.com tier
- Monitor backend logs regularly
- Set up alerts for downtime

---

## Additional Resources

- [Render.com Documentation](https://render.com/docs)
- [CORS MDN Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MongoDB Atlas Connection Guide](https://www.mongodb.com/docs/atlas/connect-to-cluster/)


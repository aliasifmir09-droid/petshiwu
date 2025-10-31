# petshiwu.com Setup - 2 Custom Domains Only (Frontend + Admin)

Since you have a 2-domain limit on Render, we'll use:
- **Frontend**: Custom domain (`www.petshiwu.com`)
- **Admin**: Custom domain (`dashboard.petshiwu.com` or `manage.petshiwu.com`)
- **Backend**: Keep using Render URL (`pet-shop-5p8b.onrender.com`)

This setup works perfectly - your frontend and admin will use custom domains, and they'll connect to the backend using the Render URL.

---

## Step 1: Add DNS Records in GoDaddy

You only need to add **2 DNS records**:

### Record 1: Frontend (www)

1. In GoDaddy DNS Management, click **Add Record**
2. **Type:** `CNAME`
3. **Host:** `www`
4. **Points To:** `pet-shop-1-d7ec.onrender.com`
5. **TTL:** `1 Hour`
6. Click **Save**

### Record 2: Admin Dashboard

Choose ONE name (I recommend `dashboard`):

**Option A: Use "dashboard"**
- **Host:** `dashboard`
- **Points To:** `pet-shop-2-r3ed.onrender.com`

**Option B: Use "manage"**
- **Host:** `manage`
- **Points To:** `pet-shop-2-r3ed.onrender.com`

**Option C: Use "panel"**
- **Host:** `panel`
- **Points To:** `pet-shop-2-r3ed.onrender.com`

1. Click **Add Record**
2. **Type:** `CNAME`
3. **Host:** Your chosen name (`dashboard`, `manage`, or `panel`)
4. **Points To:** `pet-shop-2-r3ed.onrender.com`
5. **TTL:** `1 Hour`
6. Click **Save**

### Summary of DNS Records to Add

| Type | Host | Points To | Purpose |
|------|------|-----------|---------|
| CNAME | `www` | `pet-shop-1-d7ec.onrender.com` | Frontend Website |
| CNAME | `dashboard` | `pet-shop-2-r3ed.onrender.com` | Admin Dashboard |

**Note:** We're NOT adding a DNS record for the backend - it will keep using the Render URL.

---

## Step 2: Add Custom Domains in Render

### Frontend Service

1. Render Dashboard → **Frontend Service** → **Settings**
2. Scroll to **Custom Domains**
3. Click **Add Custom Domain**
4. Enter: `www.petshiwu.com`
5. Click **Save**
6. Wait for SSL certificate (5-15 minutes)

### Admin Service

1. Render Dashboard → **Admin Service** → **Settings**
2. Scroll to **Custom Domains**
3. Click **Add Custom Domain**
4. Enter: `dashboard.petshiwu.com` (or `manage.petshiwu.com` if you chose that)
5. Click **Save**
6. Wait for SSL certificate (5-15 minutes)

### Backend Service

**DO NOT add a custom domain** - keep using the Render URL: `https://pet-shop-5p8b.onrender.com`

---

## Step 3: Update Environment Variables

### Backend Environment Variables

Go to **Backend Service** → **Environment** tab → Update:

```env
CORS_ORIGIN=https://www.petshiwu.com,https://dashboard.petshiwu.com,https://pet-shop-5p8b.onrender.com
FRONTEND_URL=https://www.petshiwu.com
ADMIN_URL=https://dashboard.petshiwu.com
```

**Important Notes:**
- Include the Render backend URL in CORS_ORIGIN (for development/testing)
- Include both custom domains (frontend and admin)
- Replace `dashboard` with your chosen admin subdomain if different

### Frontend Environment Variables

Go to **Frontend Service** → **Environment** tab → Update:

```env
VITE_API_URL=https://pet-shop-5p8b.onrender.com/api
```

**Note:** Using the Render backend URL, not `api.petshiwu.com`

### Admin Environment Variables

Go to **Admin Service** → **Environment** tab → Update:

```env
VITE_API_URL=https://pet-shop-5p8b.onrender.com/api
```

**Note:** Using the Render backend URL, not `api.petshiwu.com`

---

## Step 4: Redeploy All Services

After updating environment variables:

1. **Backend**: Manual Deploy → Deploy latest commit
2. **Frontend**: Manual Deploy → Deploy latest commit
3. **Admin**: Manual Deploy → Deploy latest commit

Wait for all deployments to complete.

---

## Step 5: Wait and Test

### DNS Propagation

Wait 1-4 hours for DNS to propagate. Check with [DNS Checker](https://dnschecker.org/):
- `www.petshiwu.com` → Should show `pet-shop-1-d7ec.onrender.com`
- `dashboard.petshiwu.com` → Should show `pet-shop-2-r3ed.onrender.com`

### Test Your Sites

1. **Frontend**: `https://www.petshiwu.com`
   - Should load your website
   - Should connect to backend at `pet-shop-5p8b.onrender.com/api`

2. **Admin Dashboard**: `https://dashboard.petshiwu.com`
   - Should show admin login
   - Should connect to backend at `pet-shop-5p8b.onrender.com/api`

3. **Backend API**: `https://pet-shop-5p8b.onrender.com/api`
   - Still accessible at Render URL
   - Can be used by both frontend and admin

---

## Final Configuration Summary

### DNS Records (GoDaddy)
```
✅ CNAME: www → pet-shop-1-d7ec.onrender.com
✅ CNAME: dashboard → pet-shop-2-r3ed.onrender.com
❌ No API DNS record needed
```

### Custom Domains (Render)
```
✅ Frontend: www.petshiwu.com
✅ Admin: dashboard.petshiwu.com
❌ Backend: No custom domain (using Render URL)
```

### Environment Variables
```
✅ Backend CORS_ORIGIN: Includes www.petshiwu.com, dashboard.petshiwu.com, and Render backend URL
✅ Frontend VITE_API_URL: https://pet-shop-5p8b.onrender.com/api
✅ Admin VITE_API_URL: https://pet-shop-5p8b.onrender.com/api
```

### Final URLs
```
✅ Frontend: https://www.petshiwu.com
✅ Admin: https://dashboard.petshiwu.com
✅ Backend API: https://pet-shop-5p8b.onrender.com/api (Render URL)
```

---

## Advantages of This Setup

✅ **Saves Custom Domain**: Only uses 2 domains (frontend + admin)  
✅ **Professional URLs**: Users see `www.petshiwu.com` (not Render URL)  
✅ **Works Perfectly**: API calls work the same, just using Render backend URL  
✅ **No Limitations**: No issues with backend on Render URL  
✅ **Easy Setup**: Fewer DNS records to manage  

---

## Important Notes

1. **Backend URL is Public**: The Render backend URL will still be accessible
   - This is fine - it's normal for APIs to be accessible
   - You can add authentication/rate limiting if needed
   - Users won't see it - only frontend/admin use it

2. **CORS Configuration**: Make sure backend CORS_ORIGIN includes:
   - Your custom frontend domain
   - Your custom admin domain
   - The Render backend URL (for development/testing)

3. **SSL Certificates**: 
   - Render automatically provides SSL for custom domains
   - Backend Render URL already has SSL
   - All connections will be HTTPS

4. **No Performance Impact**: 
   - Using Render URL for backend has no performance impact
   - API calls work the same way
   - Users won't notice any difference

---

## Troubleshooting

### Frontend/Admin Can't Connect to Backend

**Check:**
1. `VITE_API_URL` is set to `https://pet-shop-5p8b.onrender.com/api`
2. Backend service is running (check Render dashboard)
3. Backend CORS_ORIGIN includes your custom domains
4. Check browser console for CORS errors

### DNS Not Working

1. Wait longer (1-4 hours for full propagation)
2. Check DNS Checker to verify propagation
3. Clear DNS cache: `ipconfig /flushdns` (Windows)

### SSL Certificate Issues

1. Wait 10-15 minutes after adding custom domain
2. Check Render dashboard - SSL should show "Active"
3. Verify DNS is pointing correctly before SSL can be issued

---

## Checklist

- [ ] Added DNS: `www` → `pet-shop-1-d7ec.onrender.com`
- [ ] Added DNS: `dashboard` → `pet-shop-2-r3ed.onrender.com`
- [ ] Added custom domain in Render: `www.petshiwu.com` (Frontend)
- [ ] Added custom domain in Render: `dashboard.petshiwu.com` (Admin)
- [ ] Updated Backend CORS_ORIGIN with both custom domains + Render backend URL
- [ ] Updated Frontend VITE_API_URL = `https://pet-shop-5p8b.onrender.com/api`
- [ ] Updated Admin VITE_API_URL = `https://pet-shop-5p8b.onrender.com/api`
- [ ] Redeployed all three services
- [ ] Waited for DNS propagation
- [ ] Tested `https://www.petshiwu.com`
- [ ] Tested `https://dashboard.petshiwu.com`
- [ ] Verified no CORS errors in browser console

---

## Quick Reference

**Your Setup:**
- Frontend: `https://www.petshiwu.com` (Custom Domain)
- Admin: `https://dashboard.petshiwu.com` (Custom Domain)
- Backend: `https://pet-shop-5p8b.onrender.com/api` (Render URL)

**Environment Variables:**
```env
# Backend
CORS_ORIGIN=https://www.petshiwu.com,https://dashboard.petshiwu.com,https://pet-shop-5p8b.onrender.com

# Frontend & Admin
VITE_API_URL=https://pet-shop-5p8b.onrender.com/api
```

This setup is perfect for your 2-domain limit!


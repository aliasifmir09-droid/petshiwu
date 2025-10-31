# petshiwu.com Domain Setup Guide

This guide is specifically for connecting **www.petshiwu.com** to your Render services.

## Your Current Setup

- **Domain**: www.petshiwu.com
- **Backend**: https://pet-shop-5p8b.onrender.com
- **Frontend**: https://pet-shop-1-d7ec.onrender.com/
- **Admin**: https://pet-shop-2-r3ed.onrender.com/

## Recommended Domain Structure

- **Frontend**: `www.petshiwu.com` or `petshiwu.com`
- **API Backend**: `api.petshiwu.com`
- **Admin Dashboard**: `admin.petshiwu.com`

---

## Step 1: Configure DNS in GoDaddy

### Log into GoDaddy

1. Go to [GoDaddy.com](https://www.godaddy.com) and sign in
2. Click **My Products**
3. Find **petshiwu.com** and click **DNS** (or **Manage DNS**)

### Add CNAME Records

In the DNS management page, add these CNAME records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | api | `pet-shop-5p8b.onrender.com` | 1 Hour |
| CNAME | www | `pet-shop-1-d7ec.onrender.com` | 1 Hour |
| CNAME | admin | `pet-shop-2-r3ed.onrender.com` | 1 Hour |

**Important Notes:**
- Do NOT include `https://` in the Value field
- Do NOT include trailing slashes
- The Name field should be just `api`, `www`, or `admin` (not `api.petshiwu.com`)

### For Root Domain (Optional)

If you want `petshiwu.com` (without www) to work:

- Option 1: Add a redirect in GoDaddy from `petshiwu.com` → `www.petshiwu.com`
- Option 2: Add another CNAME: Name = `@`, Value = `pet-shop-1-d7ec.onrender.com` (if GoDaddy supports CNAME for root)

---

## Step 2: Add Custom Domains in Render

### Backend Service (pet-shop-5p8b.onrender.com)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your **Backend service** (pet-shop-api or similar name)
3. Go to **Settings** tab
4. Scroll to **Custom Domains** section
5. Click **Add Custom Domain**
6. Enter: `api.petshiwu.com`
7. Click **Save**
8. **Wait 5-10 minutes** for SSL certificate to be provisioned

### Frontend Service (pet-shop-1-d7ec.onrender.com)

1. Go to Render Dashboard
2. Click on your **Frontend service**
3. Go to **Settings** tab
4. Scroll to **Custom Domains** section
5. Click **Add Custom Domain**
6. Enter: `www.petshiwu.com`
7. Click **Save**
8. Wait for SSL certificate

### Admin Service (pet-shop-2-r3ed.onrender.com)

1. Go to Render Dashboard
2. Click on your **Admin service**
3. Go to **Settings** tab
4. Scroll to **Custom Domains** section
5. Click **Add Custom Domain**
6. Enter: `admin.petshiwu.com`
7. Click **Save**
8. Wait for SSL certificate

---

## Step 3: Update Environment Variables in Render

### Backend Environment Variables

1. Go to Backend service → **Environment** tab
2. Update or add these variables:

```env
CORS_ORIGIN=https://www.petshiwu.com,https://admin.petshiwu.com,https://api.petshiwu.com
FRONTEND_URL=https://www.petshiwu.com
ADMIN_URL=https://admin.petshiwu.com
```

**Important:** 
- Use commas to separate multiple URLs (no spaces)
- Include `https://` protocol
- No trailing slashes

### Frontend Environment Variables

1. Go to Frontend service → **Environment** tab
2. Update:

```env
VITE_API_URL=https://api.petshiwu.com/api
```

**Important:**
- Must include `/api` at the end
- Use `https://`

### Admin Environment Variables

1. Go to Admin service → **Environment** tab
2. Update:

```env
VITE_API_URL=https://api.petshiwu.com/api
```

---

## Step 4: Redeploy Services

After updating environment variables, you need to redeploy:

### Option A: Manual Redeploy (Recommended)

1. For each service (Backend, Frontend, Admin):
   - Go to the service page
   - Click **Manual Deploy** → **Deploy latest commit**
   - Wait for deployment to complete

### Option B: Trigger via Git Push

Just push any commit to trigger auto-deploy (if auto-deploy is enabled)

---

## Step 5: Verify DNS Propagation

Wait 1-4 hours for DNS to propagate (sometimes faster, sometimes slower).

### Check DNS Propagation

1. Visit [DNS Checker](https://dnschecker.org/)
2. Select **CNAME** record type
3. Enter:
   - `api.petshiwu.com`
   - `www.petshiwu.com`
   - `admin.petshiwu.com`
4. Click **Search**
5. Wait until most/all locations show your Render URLs

### Test Your Domains

Once DNS has propagated:

- ✅ `https://api.petshiwu.com` - Should show API info JSON
- ✅ `https://www.petshiwu.com` - Should show your frontend website
- ✅ `https://admin.petshiwu.com` - Should show admin login page

---

## Step 6: Test Everything

### Test Backend API

```bash
# Should return API info
curl https://api.petshiwu.com/api

# Or visit in browser:
https://api.petshiwu.com/api
```

### Test Frontend

1. Visit `https://www.petshiwu.com`
2. Open browser console (F12)
3. Check Network tab for API calls
4. Verify API calls are going to `https://api.petshiwu.com/api`
5. No CORS errors should appear

### Test Admin Dashboard

1. Visit `https://admin.petshiwu.com`
2. Try logging in
3. Check browser console for errors
4. Verify API calls are working

---

## Troubleshooting

### DNS Not Working

**Symptoms:** Domain shows "Site can't be reached" or old content

**Solutions:**
1. Double-check DNS records in GoDaddy (no typos, correct values)
2. Wait longer (up to 48 hours for full propagation)
3. Clear DNS cache:
   - Windows: `ipconfig /flushdns` in Command Prompt
   - Mac: `sudo dscacheutil -flushcache`
   - Or restart your router

### SSL Certificate Not Provisioned

**Symptoms:** Browser shows "Not Secure" or SSL error

**Solutions:**
1. Ensure DNS is pointing correctly (check with DNS checker)
2. Wait 10-15 minutes after adding domain in Render
3. Check Render dashboard - SSL should show "Active" status
4. Try clearing browser cache or use incognito mode

### CORS Errors

**Symptoms:** Browser console shows CORS errors

**Solutions:**
1. Verify `CORS_ORIGIN` in backend includes all your domains
2. Ensure no trailing slashes in CORS_ORIGIN
3. Include `https://` protocol
4. Redeploy backend after updating CORS_ORIGIN

### Frontend Can't Connect to API

**Symptoms:** Frontend loads but API calls fail

**Solutions:**
1. Check `VITE_API_URL` is set to `https://api.petshiwu.com/api`
2. Verify backend is accessible at `https://api.petshiwu.com/api`
3. Check browser console Network tab for failed requests
4. Ensure backend CORS_ORIGIN includes frontend domain

### Admin Can't Connect to API

**Symptoms:** Admin loads but can't login or fetch data

**Solutions:**
1. Check `VITE_API_URL` in admin environment variables
2. Verify it's set to `https://api.petshiwu.com/api`
3. Check browser console for API errors
4. Ensure backend CORS_ORIGIN includes admin domain

---

## Quick Reference Checklist

- [ ] DNS records added in GoDaddy (api, www, admin)
- [ ] Custom domain added in Render for Backend (api.petshiwu.com)
- [ ] Custom domain added in Render for Frontend (www.petshiwu.com)
- [ ] Custom domain added in Render for Admin (admin.petshiwu.com)
- [ ] SSL certificates active in Render (check dashboard)
- [ ] Backend CORS_ORIGIN updated with all domains
- [ ] Backend FRONTEND_URL and ADMIN_URL updated
- [ ] Frontend VITE_API_URL updated to https://api.petshiwu.com/api
- [ ] Admin VITE_API_URL updated to https://api.petshiwu.com/api
- [ ] All services redeployed
- [ ] DNS propagated (checked with DNS checker)
- [ ] All domains accessible via HTTPS
- [ ] Frontend working and connecting to API
- [ ] Admin working and connecting to API

---

## Expected Final URLs

After setup is complete, your sites will be accessible at:

- **Frontend**: https://www.petshiwu.com
- **Backend API**: https://api.petshiwu.com/api
- **Admin Dashboard**: https://admin.petshiwu.com

---

## Need Help?

If something isn't working:

1. **Check Render Logs**: Go to each service → Logs tab
2. **Check Browser Console**: F12 → Console tab for errors
3. **Verify DNS**: Use DNS checker to confirm propagation
4. **Check Environment Variables**: Ensure all are set correctly
5. **Wait for Propagation**: DNS can take time, be patient!

---

## Important Notes

- ⏱️ DNS propagation: 1-48 hours (usually 1-4 hours)
- 🔒 SSL certificates: Auto-provisioned by Render (5-15 minutes)
- 🔄 Redeploy required: After changing environment variables
- ✅ Test in incognito: To avoid browser cache issues


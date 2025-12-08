# Render Deployment Guide - SPA Routing Fix

## ✅ Good News: Render Handles SPA Routing Automatically!

Render's static site hosting **automatically handles SPA routing** for React applications. However, to ensure it works correctly, we've added a `_redirects` file as a backup.

## Current Configuration

Your `render.yaml` is correctly configured:

```yaml
- type: web
  name: pet-shop-frontend
  env: static
  rootDir: frontend
  plan: free
  buildCommand: npm install && npm run build
  staticPublishPath: dist
```

## How Render Handles SPA Routing

1. **Automatic Fallback:** Render automatically serves `index.html` for routes that don't match physical files
2. **No Configuration Needed:** For static sites, Render handles this out of the box
3. **Backup `_redirects` File:** We've added `frontend/public/_redirects` as a safety net

## Files Included

### `frontend/public/_redirects`
```
/*    /index.html   200
```

This file is automatically copied to `dist/` during build by Vite (since it's in the `public/` folder).

## Testing After Deployment

1. **Deploy to Render:**
   - Push your code to GitHub
   - Render will automatically build and deploy

2. **Test Direct URL Access:**
   ```
   https://pet-shop-frontend.onrender.com/dog/food/product-slug
   ```
   Should load correctly (not 404)

3. **Test Navigation:**
   - Click through the site
   - All routes should work

4. **Test Browser Refresh:**
   - Navigate to a product page
   - Press F5 to refresh
   - Should stay on the same page

## If You Still Get 404 Errors

### Option 1: Verify `_redirects` File is Deployed
1. Check Render build logs
2. Verify `_redirects` file exists in `dist/` folder
3. If missing, Vite might not be copying it - we can fix this

### Option 2: Manual Render Configuration
If automatic routing doesn't work, you can add a custom `render.yaml` redirect:

```yaml
- type: web
  name: pet-shop-frontend
  env: static
  rootDir: frontend
  plan: free
  buildCommand: npm install && npm run build
  staticPublishPath: dist
  routes:
    - type: rewrite
      source: /*
      destination: /index.html
```

However, this should **not be necessary** - Render handles it automatically.

## Custom Domain Setup

If you're using a custom domain (like `petshiwu.com`):

1. **In Render Dashboard:**
   - Go to your static site service
   - Click "Settings" → "Custom Domains"
   - Add your domain

2. **DNS Configuration:**
   - Add CNAME record pointing to your Render service
   - Render will provide the exact CNAME target

3. **SSL:**
   - Render automatically provisions SSL certificates
   - Usually takes a few minutes after domain is added

## Environment Variables

Make sure these are set in Render:

- `VITE_API_URL` - Your backend API URL (e.g., `https://pet-shop-api.onrender.com/api`)

## Build Process

Render will:
1. Run `npm install && npm run build`
2. Copy everything from `dist/` folder
3. Serve the static files
4. Automatically handle SPA routing

## Summary

✅ **Render automatically handles SPA routing** for static sites
✅ **`_redirects` file included** as backup
✅ **No additional configuration needed**
✅ **All product pages should work** after deployment

If you encounter any issues, check:
1. Build logs in Render dashboard
2. Verify `_redirects` file is in `dist/` folder
3. Check Render service settings


# Fixing 404 Errors on Page Refresh - Render Static Site

## Problem
When refreshing any page or navigating back, you get "Not Found" errors. This happens because Render's static site hosting doesn't automatically handle client-side routing for BrowserRouter.

## Solution

The `_redirects` file should work, but if it's not, you need to manually configure it in Render Dashboard:

### Option 1: Manual Configuration in Render Dashboard (Recommended)

1. Go to **Render Dashboard** → Your Frontend Service
2. Click on **Settings** → **Redirects & Rewrites**
3. Add a new redirect rule:
   - **Source Path:** `/*`
   - **Destination:** `/index.html`
   - **Type:** `Rewrite` (NOT Redirect - this is important!)
   - **Status Code:** `200`

4. Save and wait for the service to redeploy

### Option 2: Verify _redirects File

The `_redirects` file should be in `frontend/public/_redirects` with this content:
```
/*    /index.html   200
```

After build, it should be copied to `frontend/dist/_redirects`.

### Option 3: Check Service Type

Ensure your service is configured as:
- **Type:** Static Site (not Web Service)
- **Environment:** `static` (in render.yaml)

### Verification

After configuration:
1. Visit: `https://your-domain.com/cat/food/product-slug`
2. Refresh the page (F5)
3. Should stay on the same page (not 404)

## Why This Happens

BrowserRouter uses clean URLs without `#`, but when you refresh:
- Browser requests: `GET /cat/food/product-slug`
- Server looks for: `/cat/food/product-slug` file
- File doesn't exist → 404 error

The redirect/rewrite rule tells the server:
- "For any path that doesn't match a file, serve `index.html`"
- React Router then handles the routing client-side

## Current Status

✅ `_redirects` file exists in `frontend/public/`
✅ File is copied to `dist/` during build
⚠️ Render may need manual configuration in Dashboard


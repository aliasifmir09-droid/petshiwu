# GoDaddy Domain Setup Guide

This guide will help you connect your GoDaddy domain to your Render-deployed applications (Backend, Frontend, and Admin Dashboard).

## Prerequisites

- Domain purchased from GoDaddy
- Render account with deployed services
- Access to GoDaddy DNS management

## Step 1: Get Your Render Service URLs

First, note down your current Render service URLs:
- **Backend API**: `https://pet-shop-api.onrender.com` (or your backend URL)
- **Frontend**: `https://pet-shop-frontend.onrender.com` (or your frontend URL)
- **Admin Dashboard**: `https://pet-shop-admin.onrender.com` (or your admin URL)

## Step 2: Configure DNS in GoDaddy

### Option A: Use Subdomain for Each Service (Recommended)

Example: `api.yourdomain.com`, `www.yourdomain.com`, `admin.yourdomain.com`

1. **Log in to GoDaddy**
   - Go to [GoDaddy.com](https://www.godaddy.com) and sign in
   - Go to **My Products** → **Domains** → Click **DNS** next to your domain

2. **Add DNS Records**

   For each service, add a **CNAME record**:

   | Type | Name | Value | TTL |
   |------|------|-------|-----|
   | CNAME | api | `pet-shop-api.onrender.com` | 1 Hour |
   | CNAME | www | `pet-shop-frontend.onrender.com` | 1 Hour |
   | CNAME | admin | `pet-shop-admin.onrender.com` | 1 Hour |
   | A | @ | `192.0.2.1` | 1 Hour (or use CNAME for root) |

   **Notes:**
   - Replace `pet-shop-api.onrender.com`, etc. with your actual Render URLs
   - For the root domain (@), you may need to use an A record pointing to Render's IP (check Render docs) or use CNAME if supported

### Option B: Use Root Domain

If you want to use `yourdomain.com` for the frontend:

1. Add CNAME records for subdomains (api, admin)
2. For the root domain, you may need to:
   - Use GoDaddy's forwarding service to redirect `yourdomain.com` → `www.yourdomain.com`
   - Or use an A record (check Render's IP addresses in their documentation)

## Step 3: Add Custom Domain in Render

### For Backend Service

1. Go to Render Dashboard → Your Backend Service
2. Go to **Settings** tab
3. Scroll to **Custom Domains**
4. Click **Add Custom Domain**
5. Enter your API subdomain: `api.yourdomain.com`
6. Render will provide DNS verification instructions (if needed)
7. **Wait for SSL certificate** (usually takes a few minutes)

### For Frontend Service

1. Go to Render Dashboard → Your Frontend Service
2. Go to **Settings** tab
3. Scroll to **Custom Domains**
4. Click **Add Custom Domain**
5. Enter your domain: `www.yourdomain.com` (or `yourdomain.com`)
6. Wait for SSL certificate

### For Admin Dashboard

1. Go to Render Dashboard → Your Admin Service
2. Go to **Settings** tab
3. Scroll to **Custom Domains**
4. Click **Add Custom Domain**
5. Enter: `admin.yourdomain.com`
6. Wait for SSL certificate

## Step 4: Update Environment Variables

After domains are configured, update environment variables in Render:

### Backend Environment Variables

Update these in Render → Backend Service → Environment:

```env
CORS_ORIGIN=https://www.yourdomain.com,https://admin.yourdomain.com,https://api.yourdomain.com
FRONTEND_URL=https://www.yourdomain.com
ADMIN_URL=https://admin.yourdomain.com
```

### Frontend Environment Variables

Update in Render → Frontend Service → Environment:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

### Admin Environment Variables

Update in Render → Admin Service → Environment:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

## Step 5: Verify DNS Propagation

DNS changes can take 24-48 hours to propagate, but usually complete within a few hours.

### Check DNS Propagation

Use these tools to verify:
- [DNS Checker](https://dnschecker.org/)
- [What's My DNS](https://www.whatsmydns.net/)

### Test Your Domains

Once DNS propagates, test:
- `https://api.yourdomain.com` - Should show API info
- `https://www.yourdomain.com` - Should show frontend
- `https://admin.yourdomain.com` - Should show admin login

## Step 6: Update render.yaml (Optional)

If you're using `render.yaml`, update it with your custom domains:

```yaml
services:
  - type: web
    name: pet-shop-api
    # ... other config ...
    customDomains:
      - api.yourdomain.com
    
  - type: web
    name: pet-shop-frontend
    # ... other config ...
    customDomains:
      - www.yourdomain.com
      - yourdomain.com
    
  - type: web
    name: pet-shop-admin
    # ... other config ...
    customDomains:
      - admin.yourdomain.com
```

## Step 7: Redeploy Services

After updating environment variables:

1. **Redeploy Backend**: Trigger a new deploy (or wait for auto-deploy)
2. **Redeploy Frontend**: Trigger a new deploy
3. **Redeploy Admin**: Trigger a new deploy

## Troubleshooting

### DNS Not Propagating

1. **Check GoDaddy DNS**: Ensure records are saved correctly
2. **Clear DNS Cache**: Use `ipconfig /flushdns` (Windows) or restart network
3. **Check TTL**: Lower TTL values propagate faster
4. **Wait Longer**: DNS can take up to 48 hours

### SSL Certificate Issues

1. **Wait for SSL**: Render automatically provisions SSL certificates (5-10 minutes)
2. **Check DNS**: Ensure DNS is pointing correctly before SSL can be issued
3. **Manual SSL**: If needed, Render allows manual SSL certificate upload

### CORS Errors

If you see CORS errors after switching domains:

1. **Check CORS_ORIGIN**: Ensure all your domains are in the backend `CORS_ORIGIN` variable
2. **Include Protocol**: Make sure URLs include `https://`
3. **No Trailing Slashes**: Remove trailing slashes from CORS_ORIGIN values
4. **Redeploy Backend**: After updating CORS_ORIGIN, redeploy the backend

### API Not Working

1. **Check VITE_API_URL**: Ensure frontend and admin have correct API URL
2. **Include /api**: API URL should end with `/api` (e.g., `https://api.yourdomain.com/api`)
3. **Verify Backend**: Test backend directly at `https://api.yourdomain.com/api`

### Frontend Not Loading

1. **Check Build**: Ensure frontend builds successfully
2. **Check Static Path**: Verify `staticPublishPath: dist` is set correctly
3. **Check Routes**: Ensure `_redirects` file exists in `public/` folder

## Example DNS Configuration

Here's a complete example for `yourdomain.com`:

```
Type    Name    Value                                    TTL
CNAME   api     pet-shop-api.onrender.com              1 Hour
CNAME   www     pet-shop-frontend.onrender.com         1 Hour
CNAME   admin   pet-shop-admin.onrender.com            1 Hour
CNAME   @       pet-shop-frontend.onrender.com         1 Hour (if supported)
```

Or if root domain requires A record:

```
Type    Name    Value                                    TTL
A       @       192.0.2.1                               1 Hour
CNAME   api     pet-shop-api.onrender.com              1 Hour
CNAME   www     pet-shop-frontend.onrender.com         1 Hour
CNAME   admin   pet-shop-admin.onrender.com            1 Hour
```

## Security Considerations

1. **HTTPS Only**: Render automatically provides HTTPS for custom domains
2. **Environment Variables**: Never commit sensitive env vars to Git
3. **CORS**: Keep CORS_ORIGIN restricted to your domains only
4. **API Keys**: Rotate any API keys after domain migration

## Quick Checklist

- [ ] DNS records added in GoDaddy
- [ ] Custom domains added in Render for all services
- [ ] SSL certificates provisioned (check Render dashboard)
- [ ] Environment variables updated (CORS_ORIGIN, VITE_API_URL, etc.)
- [ ] All services redeployed
- [ ] DNS propagated (checked with DNS checker)
- [ ] All domains accessible via HTTPS
- [ ] Frontend can connect to API
- [ ] Admin can connect to API
- [ ] No CORS errors in browser console

## Support Resources

- **GoDaddy DNS Help**: [GoDaddy DNS Management](https://www.godaddy.com/help/manage-dns-680)
- **Render Custom Domains**: [Render Custom Domains Docs](https://render.com/docs/custom-domains)
- **DNS Propagation Checker**: [DNS Checker](https://dnschecker.org/)

## Need Help?

If you encounter issues:
1. Check Render service logs
2. Check browser console for errors
3. Verify DNS propagation
4. Ensure all environment variables are correct
5. Verify SSL certificates are active


# DNS Troubleshooting Guide for petshiwu.com

## Common Issues & Solutions

### Issue 1: "Site Can't Be Reached" or "This site can't be found"

**Causes:**
- DNS hasn't propagated yet
- DNS records are incorrect
- Custom domain not added in Render

**Solutions:**

1. **Check DNS Propagation**
   - Visit [DNS Checker](https://dnschecker.org/)
   - Select **CNAME** record type
   - Check:
     - `api.petshiwu.com`
     - `www.petshiwu.com`
     - `admin.petshiwu.com`
   - Wait until at least 50% of locations show your Render URLs

2. **Verify DNS Records in GoDaddy**
   - Log into GoDaddy
   - Go to DNS Management
   - Verify records are exactly:
     ```
     Type: CNAME | Name: api | Value: pet-shop-5p8b.onrender.com
     Type: CNAME | Name: www | Value: pet-shop-1-d7ec.onrender.com
     Type: CNAME | Name: admin | Value: pet-shop-2-r3ed.onrender.com
     ```
   - NO `https://` in Value
   - NO trailing slashes
   - NO `.com` at the end of Value (just the .onrender.com domain)

3. **Check Custom Domain in Render**
   - Go to each service in Render Dashboard
   - Settings → Custom Domains
   - Verify domains are added:
     - Backend: `api.petshiwu.com`
     - Frontend: `www.petshiwu.com`
     - Admin: `admin.petshiwu.com`
   - Check SSL status (should be "Active" or "Provisioning")

4. **Clear DNS Cache**
   - Windows: Open Command Prompt → `ipconfig /flushdns`
   - Mac: Terminal → `sudo dscacheutil -flushcache`
   - Or restart your router

### Issue 2: SSL Certificate Error or "Not Secure"

**Causes:**
- DNS not fully propagated when SSL was requested
- SSL certificate still provisioning

**Solutions:**

1. **Wait for SSL Provisioning**
   - Render automatically provisions SSL certificates
   - Usually takes 5-15 minutes after DNS is correct
   - Check Render Dashboard → Custom Domains → SSL status

2. **Re-request SSL Certificate**
   - In Render, go to Custom Domains
   - Remove and re-add the custom domain
   - Wait 10-15 minutes for new SSL

3. **Verify DNS is Correct**
   - SSL can't be issued if DNS isn't pointing correctly
   - Use DNS checker to verify propagation

### Issue 3: Site Loads But Shows Wrong Content / Old Site

**Causes:**
- Browser cache
- DNS still pointing to old location
- CDN cache

**Solutions:**

1. **Clear Browser Cache**
   - Chrome: Ctrl+Shift+Delete → Clear cached images and files
   - Or use Incognito/Private mode to test

2. **Check DNS is Pointing to Render**
   - Use [DNS Checker](https://dnschecker.org/)
   - Verify CNAME records point to your Render URLs

3. **Wait for Full Propagation**
   - DNS can take 24-48 hours for full global propagation
   - Most areas should work within 1-4 hours

### Issue 4: "CORS Error" in Browser Console

**Causes:**
- Backend CORS_ORIGIN doesn't include your new domains
- Environment variables not updated

**Solutions:**

1. **Update Backend CORS_ORIGIN**
   - Go to Render → Backend Service → Environment
   - Update CORS_ORIGIN to:
     ```
     https://www.petshiwu.com,https://admin.petshiwu.com,https://api.petshiwu.com
     ```
   - NO spaces after commas
   - Include `https://`
   - NO trailing slashes

2. **Redeploy Backend**
   - After updating CORS_ORIGIN, trigger a redeploy
   - Wait for deployment to complete

3. **Verify Environment Variables**
   - Backend should have:
     - `CORS_ORIGIN=https://www.petshiwu.com,https://admin.petshiwu.com,https://api.petshiwu.com`
     - `FRONTEND_URL=https://www.petshiwu.com`
     - `ADMIN_URL=https://admin.petshiwu.com`

### Issue 5: Frontend/Admin Can't Connect to API

**Causes:**
- VITE_API_URL not updated
- Wrong API URL format
- API not accessible

**Solutions:**

1. **Update VITE_API_URL**
   - Frontend Environment:
     ```
     VITE_API_URL=https://api.petshiwu.com/api
     ```
   - Admin Environment:
     ```
     VITE_API_URL=https://api.petshiwu.com/api
     ```
   - MUST include `/api` at the end
   - Use `https://` protocol

2. **Redeploy Services**
   - After updating VITE_API_URL, redeploy Frontend and Admin
   - Wait for deployments to complete

3. **Test API Directly**
   - Visit: `https://api.petshiwu.com/api`
   - Should show JSON with API info
   - If not working, check backend service status in Render

### Issue 6: DNS Shows Old/Incorrect Values

**Causes:**
- DNS record not saved correctly
- Typo in DNS record
- Wrong record type

**Solutions:**

1. **Double-Check Each Record**
   - Go to GoDaddy DNS Management
   - Verify each record:
     - **Type** is CNAME (not A record)
     - **Name** is exactly `api`, `www`, or `admin` (lowercase)
     - **Value** matches your Render URLs exactly
     - **TTL** can be 1 Hour or Auto

2. **Delete and Recreate Records**
   - If unsure, delete the record
   - Create a fresh CNAME record
   - Double-check spelling before saving

3. **Check for Duplicate Records**
   - Ensure you don't have multiple records with same name
   - Delete duplicates if found

## Step-by-Step Verification Checklist

### Step 1: Verify DNS Records in GoDaddy
- [ ] All three CNAME records exist
- [ ] Type is CNAME (not A)
- [ ] Names are: `api`, `www`, `admin` (exactly, lowercase)
- [ ] Values are correct Render URLs (no https://, no slashes)
- [ ] No typos in values

### Step 2: Verify DNS Propagation
- [ ] Visit [DNS Checker](https://dnschecker.org/)
- [ ] Check `api.petshiwu.com` - shows `pet-shop-5p8b.onrender.com`
- [ ] Check `www.petshiwu.com` - shows `pet-shop-1-d7ec.onrender.com`
- [ ] Check `admin.petshiwu.com` - shows `pet-shop-2-r3ed.onrender.com`
- [ ] At least 50% of locations show correct values

### Step 3: Verify Custom Domains in Render
- [ ] Backend has `api.petshiwu.com` added
- [ ] Frontend has `www.petshiwu.com` added
- [ ] Admin has `admin.petshiwu.com` added
- [ ] SSL certificates show "Active" (or "Provisioning" is fine)

### Step 4: Verify Environment Variables
- [ ] Backend CORS_ORIGIN includes all three domains
- [ ] Backend FRONTEND_URL is `https://www.petshiwu.com`
- [ ] Backend ADMIN_URL is `https://admin.petshiwu.com`
- [ ] Frontend VITE_API_URL is `https://api.petshiwu.com/api`
- [ ] Admin VITE_API_URL is `https://api.petshiwu.com/api`

### Step 5: Verify Services are Deployed
- [ ] All services show "Live" status in Render
- [ ] Recent deployments completed successfully
- [ ] No error logs in Render service logs

### Step 6: Test URLs
- [ ] `https://api.petshiwu.com/api` - Shows API JSON
- [ ] `https://www.petshiwu.com` - Shows frontend website
- [ ] `https://admin.petshiwu.com` - Shows admin login
- [ ] Open browser console (F12) - No CORS errors
- [ ] Frontend can load products/categories
- [ ] Admin can login and access dashboard

## Quick Test Commands

### Test DNS from Command Line

**Windows:**
```cmd
nslookup api.petshiwu.com
nslookup www.petshiwu.com
nslookup admin.petshiwu.com
```

**Mac/Linux:**
```bash
dig api.petshiwu.com
dig www.petshiwu.com
dig admin.petshiwu.com
```

Expected: Should show CNAME pointing to your Render URLs

### Test API Directly
```bash
curl https://api.petshiwu.com/api
```

Expected: JSON response with API info

## Still Having Issues?

1. **Check Render Logs**
   - Go to each service → Logs tab
   - Look for errors or warnings
   - Check if services are running

2. **Check Browser Console**
   - Press F12 → Console tab
   - Look for error messages
   - Share error details for help

3. **Verify Service Status**
   - Check Render dashboard - all services should be "Live"
   - If service is paused, resume it
   - Check if free tier services have spun down (they spin down after inactivity)

4. **Time Considerations**
   - DNS: Wait at least 1-4 hours
   - SSL: Wait 10-15 minutes after DNS is correct
   - Deployments: Wait for completion (usually 2-5 minutes)

## Common Mistakes to Avoid

❌ Adding `https://` in DNS Value field
❌ Adding trailing slashes (`/`) in DNS or environment variables
❌ Using A records instead of CNAME for Render
❌ Forgetting to include `/api` at end of VITE_API_URL
❌ Not redeploying after changing environment variables
❌ Testing too quickly (DNS needs time to propagate)

## Need Specific Help?

Share these details:
1. What exact error message or behavior are you seeing?
2. Which URL are you testing?
3. What do you see when visiting that URL?
4. What do browser console errors say (if any)?
5. What does DNS Checker show for your domains?
6. How long has it been since you added DNS records?


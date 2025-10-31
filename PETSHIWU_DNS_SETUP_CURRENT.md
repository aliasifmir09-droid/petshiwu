# petshiwu.com DNS Setup Guide - Based on Your Current Records

Based on your GoDaddy DNS records, here's how to set up your domain correctly.

## Your Current DNS Records

I can see you have these existing records:
- `cpanel` → petshiwu.com
- `pay` → paylinks.commerce.godaddy.com
- `webdisk` → petshiwu.com
- `webdisk.admin` → petshiwu.com
- `whm` → petshiwu.com
- `www.admin` → petshiwu.com (This is why "admin" conflicts!)

## Recommended DNS Setup

Since some names are already taken, here are your options:

### Option 1: Use Simple Names (Recommended)

**Add these NEW CNAME records:**

| Type | Host | Points To | TTL |
|------|------|-----------|-----|
| CNAME | `api` | `pet-shop-5p8b.onrender.com` | 1 Hour |
| CNAME | `www` | `pet-shop-1-d7ec.onrender.com` | 1 Hour |
| CNAME | `dashboard` | `pet-shop-2-r3ed.onrender.com` | 1 Hour |

**Final URLs:**
- Frontend: `https://www.petshiwu.com`
- Backend API: `https://api.petshiwu.com`
- Admin Dashboard: `https://dashboard.petshiwu.com`

### Option 2: Use "manage" for Admin

**Add these NEW CNAME records:**

| Type | Host | Points To | TTL |
|------|------|-----------|-----|
| CNAME | `api` | `pet-shop-5p8b.onrender.com` | 1 Hour |
| CNAME | `www` | `pet-shop-1-d7ec.onrender.com` | 1 Hour |
| CNAME | `manage` | `pet-shop-2-r3ed.onrender.com` | 1 Hour |

**Final URLs:**
- Frontend: `https://www.petshiwu.com`
- Backend API: `https://api.petshiwu.com`
- Admin Dashboard: `https://manage.petshiwu.com`

### Option 3: Use "panel" for Admin

**Add these NEW CNAME records:**

| Type | Host | Points To | TTL |
|------|------|-----------|-----|
| CNAME | `api` | `pet-shop-5p8b.onrender.com` | 1 Hour |
| CNAME | `www` | `pet-shop-1-d7ec.onrender.com` | 1 Hour |
| CNAME | `panel` | `pet-shop-2-r3ed.onrender.com` | 1 Hour |

**Final URLs:**
- Frontend: `https://www.petshiwu.com`
- Backend API: `https://api.petshiwu.com`
- Admin Dashboard: `https://panel.petshiwu.com`

---

## Step-by-Step Instructions (Using Option 1 - "dashboard")

### Step 1: Add DNS Records in GoDaddy

1. **Log into GoDaddy**
   - Go to [GoDaddy.com](https://www.godaddy.com) → Sign In
   - My Products → Domains → Click **DNS** next to petshiwu.com

2. **Add CNAME Record for API**
   - Click **Add** or **Add Record** button
   - **Type:** Select `CNAME`
   - **Host:** Enter `api` (just "api", not "api.petshiwu.com")
   - **Points To:** Enter `pet-shop-5p8b.onrender.com` (no https://, no trailing slash)
   - **TTL:** Select `1 Hour`
   - Click **Save**

3. **Add CNAME Record for Frontend (www)**
   - Click **Add Record** again
   - **Type:** `CNAME`
   - **Host:** Enter `www`
   - **Points To:** Enter `pet-shop-1-d7ec.onrender.com`
   - **TTL:** `1 Hour`
   - Click **Save**

4. **Add CNAME Record for Admin Dashboard**
   - Click **Add Record** again
   - **Type:** `CNAME`
   - **Host:** Enter `dashboard` (or `manage` or `panel` - your choice)
   - **Points To:** Enter `pet-shop-2-r3ed.onrender.com`
   - **TTL:** `1 Hour`
   - Click **Save**

### Step 2: Verify Your Records

After adding, you should see these NEW records in your list:

```
Type    Host        Points To
CNAME   api         pet-shop-5p8b.onrender.com
CNAME   www         pet-shop-1-d7ec.onrender.com
CNAME   dashboard   pet-shop-2-r3ed.onrender.com
```

**Important:**
- Don't modify the existing records (cpanel, pay, webdisk, etc.)
- Just add the three new ones above
- Make sure Host is exactly `api`, `www`, and `dashboard` (lowercase, no dots)

### Step 3: Add Custom Domains in Render

Wait 5-10 minutes after adding DNS records, then:

#### Backend Service
1. Render Dashboard → Backend Service → **Settings**
2. Scroll to **Custom Domains**
3. Click **Add Custom Domain**
4. Enter: `api.petshiwu.com`
5. Click **Save**

#### Frontend Service
1. Render Dashboard → Frontend Service → **Settings**
2. Scroll to **Custom Domains**
3. Click **Add Custom Domain**
4. Enter: `www.petshiwu.com`
5. Click **Save**

#### Admin Service
1. Render Dashboard → Admin Service → **Settings**
2. Scroll to **Custom Domains**
3. Click **Add Custom Domain**
4. Enter: `dashboard.petshiwu.com` (or whatever you chose)
5. Click **Save**

### Step 4: Update Environment Variables in Render

#### Backend Environment Variables

Go to Backend Service → **Environment** tab → Update:

```env
CORS_ORIGIN=https://www.petshiwu.com,https://dashboard.petshiwu.com,https://api.petshiwu.com
FRONTEND_URL=https://www.petshiwu.com
ADMIN_URL=https://dashboard.petshiwu.com
```

**Replace `dashboard` with your chosen name if different:**
- If you used `manage`: `https://manage.petshiwu.com`
- If you used `panel`: `https://panel.petshiwu.com`

#### Frontend Environment Variables

Go to Frontend Service → **Environment** tab → Update:

```env
VITE_API_URL=https://api.petshiwu.com/api
```

#### Admin Environment Variables

Go to Admin Service → **Environment** tab → Update:

```env
VITE_API_URL=https://api.petshiwu.com/api
```

### Step 5: Redeploy All Services

After updating environment variables:

1. **Backend**: Manual Deploy → Deploy latest commit
2. **Frontend**: Manual Deploy → Deploy latest commit
3. **Admin**: Manual Deploy → Deploy latest commit

Wait for all deployments to complete (usually 2-5 minutes each).

### Step 6: Wait and Test

**DNS Propagation:** 1-4 hours (sometimes faster)

1. **Check DNS Propagation**
   - Visit [DNS Checker](https://dnschecker.org/)
   - Test:
     - `api.petshiwu.com` → Should show `pet-shop-5p8b.onrender.com`
     - `www.petshiwu.com` → Should show `pet-shop-1-d7ec.onrender.com`
     - `dashboard.petshiwu.com` → Should show `pet-shop-2-r3ed.onrender.com`

2. **Test Your Sites**
   - `https://api.petshiwu.com/api` - Should show API JSON
   - `https://www.petshiwu.com` - Should show your website
   - `https://dashboard.petshiwu.com` - Should show admin login

---

## Quick Reference Table

### If You Use "dashboard":

| Service | Subdomain | Render URL | Custom Domain |
|---------|-----------|------------|---------------|
| Frontend | www | pet-shop-1-d7ec.onrender.com | www.petshiwu.com |
| Backend | api | pet-shop-5p8b.onrender.com | api.petshiwu.com |
| Admin | dashboard | pet-shop-2-r3ed.onrender.com | dashboard.petshiwu.com |

### If You Use "manage":

| Service | Subdomain | Render URL | Custom Domain |
|---------|-----------|------------|---------------|
| Frontend | www | pet-shop-1-d7ec.onrender.com | www.petshiwu.com |
| Backend | api | pet-shop-5p8b.onrender.com | api.petshiwu.com |
| Admin | manage | pet-shop-2-r3ed.onrender.com | manage.petshiwu.com |

### If You Use "panel":

| Service | Subdomain | Render URL | Custom Domain |
|---------|-----------|------------|---------------|
| Frontend | www | pet-shop-1-d7ec.onrender.com | www.petshiwu.com |
| Backend | api | pet-shop-5p8b.onrender.com | api.petshiwu.com |
| Admin | panel | pet-shop-2-r3ed.onrender.com | panel.petshiwu.com |

---

## Common Mistakes to Avoid

❌ **Using "admin"** - Already exists (www.admin)
❌ **Adding https://** in DNS "Points To" field
❌ **Adding trailing slashes** in DNS values
❌ **Forgetting /api** in VITE_API_URL
❌ **Not waiting** for DNS propagation (1-4 hours)
❌ **Not redeploying** after changing environment variables

---

## Checklist

- [ ] Added CNAME record: `api` → `pet-shop-5p8b.onrender.com`
- [ ] Added CNAME record: `www` → `pet-shop-1-d7ec.onrender.com`
- [ ] Added CNAME record: `dashboard` (or manage/panel) → `pet-shop-2-r3ed.onrender.com`
- [ ] Added custom domain in Render: `api.petshiwu.com`
- [ ] Added custom domain in Render: `www.petshiwu.com`
- [ ] Added custom domain in Render: `dashboard.petshiwu.com` (or your chosen name)
- [ ] Updated Backend CORS_ORIGIN with all domains
- [ ] Updated Backend FRONTEND_URL and ADMIN_URL
- [ ] Updated Frontend VITE_API_URL = `https://api.petshiwu.com/api`
- [ ] Updated Admin VITE_API_URL = `https://api.petshiwu.com/api`
- [ ] Redeployed all three services
- [ ] Waited for DNS propagation (check with DNS Checker)
- [ ] Tested all URLs in browser

---

## Need Help?

If you encounter issues:
1. Check DNS Checker to see if records are propagating
2. Verify all records are spelled correctly
3. Check Render logs for any errors
4. Make sure SSL certificates are active in Render
5. Wait longer - DNS can take time!


# ✅ cPanel Deployment Checklist

Use this checklist to ensure a smooth deployment to GoDaddy cPanel.

---

## 🔍 Pre-Deployment Verification

### 1. Check Your GoDaddy Hosting Plan
- [ ] Login to GoDaddy cPanel
- [ ] Look for "Setup Node.js App" or "Node.js Selector" in cPanel
- [ ] If NOT available → Your plan doesn't support Node.js
  - **Option A**: Upgrade to VPS/Dedicated hosting
  - **Option B**: Use alternative deployment (see guide)

### 2. Prepare MongoDB Database
- [ ] Create MongoDB Atlas account (free tier available)
- [ ] Create a new cluster
- [ ] Create database user with password
- [ ] Whitelist IP: `0.0.0.0/0` (allow all)
- [ ] Copy connection string for later

### 3. Choose Your Domain Structure
**Option A: Single Domain**
- Main site: `https://yourdomain.com`
- Admin: `https://yourdomain.com/admin`
- API: `https://yourdomain.com/api`

**Option B: Subdomains** (Recommended)
- Main site: `https://yourdomain.com`
- Admin: `https://admin.yourdomain.com`
- API: `https://api.yourdomain.com`

---

## 🏗️ Build & Prepare Files

### 4. Configure Environment Variables
- [ ] Create `frontend/.env.production`:
  ```env
  VITE_API_URL=https://yourdomain.com/api
  ```

- [ ] Create `admin/.env.production`:
  ```env
  VITE_API_URL=https://yourdomain.com/api
  ```

- [ ] Update domains in above files with YOUR actual domain

### 5. Run Deployment Script
- [ ] Open PowerShell/Terminal in project folder
- [ ] **Windows**: Run `prepare-deployment.bat`
- [ ] **Mac/Linux**: Run `bash prepare-deployment.sh`
- [ ] Wait for builds to complete
- [ ] Check that `Desktop/deployment` folder was created

### 6. Configure Backend Environment
- [ ] Open `Desktop/deployment/backend/.env.example`
- [ ] Update these values:
  - [ ] `MONGODB_URI` → Your Atlas connection string
  - [ ] `JWT_SECRET` → Random 32+ character string
  - [ ] `API_URL` → `https://yourdomain.com/api`
  - [ ] `CORS_ORIGIN` → `https://yourdomain.com`
  - [ ] `FILE_UPLOAD_PATH` → `/home/YOURCPANELUSERNAME/backend/uploads`
- [ ] Save and rename to `.env` (remove .example)

---

## 📤 Upload to cPanel

### 7. Upload Files via File Manager
- [ ] Login to GoDaddy cPanel
- [ ] Open **File Manager**
- [ ] Navigate to home directory (`/home/yourusername/`)

**Upload Frontend:**
- [ ] Go to `/home/yourusername/public_html/`
- [ ] Delete any existing files (if fresh install)
- [ ] Upload ALL files from `deployment/public_html/`
- [ ] Verify `.htaccess` file is present

**Upload Admin:**
- [ ] Create folder `/home/yourusername/admin/` (if doesn't exist)
- [ ] Upload ALL files from `deployment/admin/`
- [ ] Verify `.htaccess` file is present

**Upload Backend:**
- [ ] Create folder `/home/yourusername/backend/` (if doesn't exist)
- [ ] Upload ALL files from `deployment/backend/`
- [ ] Verify `.env` file is present and has YOUR settings
- [ ] Verify `dist` folder exists
- [ ] Verify `uploads` folder exists
- [ ] Verify `package.json` exists

### 8. Set File Permissions
- [ ] Backend folder: `755`
- [ ] Backend files: `644`
- [ ] Uploads folder: `755`
- [ ] .htaccess files: `644`

---

## ⚙️ Configure Node.js in cPanel

### 9. Setup Node.js Application
- [ ] In cPanel, find **Setup Node.js App**
- [ ] Click **Create Application**
- [ ] Configure settings:
  - **Node.js version**: `18.x` or higher
  - **Application mode**: `Production`
  - **Application root**: `backend`
  - **Application URL**: Your domain
  - **Application startup file**: `dist/server.js`
- [ ] Click **Create**
- [ ] Copy the command shown (looks like `source /home/...`)

### 10. Install Dependencies
- [ ] In cPanel, open **Terminal** (or use SSH)
- [ ] Paste the command from step 9 (activates Node.js)
- [ ] Run: `cd ~/backend`
- [ ] Run: `npm install --production`
- [ ] Wait for installation to complete
- [ ] Run: `touch ~/backend/tmp/restart.txt` to restart app

---

## 🌐 Configure Domains & Subdomains

### 11. Setup Subdomains (If Using Option B)
- [ ] In cPanel, go to **Subdomains**
- [ ] Create `admin.yourdomain.com`:
  - Document root: `/home/yourusername/admin`
- [ ] Create `api.yourdomain.com`:
  - Document root: `/home/yourusername/public_html/api`
  - Create `.htaccess` in this folder:
    ```apache
    RewriteEngine On
    RewriteRule ^(.*)$ http://localhost:5000/api/$1 [P,L]
    ```

### 12. Configure SSL (HTTPS)
- [ ] In cPanel, go to **SSL/TLS Status**
- [ ] Enable **AutoSSL** for:
  - [ ] Main domain
  - [ ] Admin subdomain (if using)
  - [ ] API subdomain (if using)
- [ ] Wait 10-15 minutes for certificates to issue
- [ ] Verify HTTPS works

---

## 🗄️ Database Setup

### 13. Seed Database with Initial Data
- [ ] Open Terminal/SSH
- [ ] Activate Node.js: `source /home/yourusername/nodevenv/backend/18/bin/activate`
- [ ] Navigate: `cd ~/backend`
- [ ] Run seed: `npm run seed`
- [ ] Verify success (should create admin user & sample data)

---

## 🧪 Testing

### 14. Test Frontend (Customer Website)
- [ ] Visit `https://yourdomain.com`
- [ ] Should load homepage with products
- [ ] Check browser console for errors (F12)
- [ ] Try browsing products
- [ ] Try adding product to cart

### 15. Test Admin Dashboard
- [ ] Visit `https://yourdomain.com/admin` (or subdomain)
- [ ] Should show login page
- [ ] Login with:
  - Email: `admin@petshiwu.com`
  - Password: `admin123`
- [ ] Should load dashboard with analytics
- [ ] Check for any errors

### 16. Test Backend API
- [ ] Visit `https://yourdomain.com/api/products`
- [ ] Should return JSON with products
- [ ] Visit `https://yourdomain.com/api/health`
- [ ] Should return API status

### 17. Test Core Features
- [ ] Product listing loads
- [ ] Product detail pages work
- [ ] Add to cart works
- [ ] Checkout process works
- [ ] Admin can view orders
- [ ] Admin can add products
- [ ] Image uploads work

---

## 🐛 Troubleshooting

### If Frontend Shows Blank Page:
- [ ] Check browser console (F12) for errors
- [ ] Verify `.htaccess` exists in public_html
- [ ] Check that API URL is correct in build

### If Admin Shows Blank Page:
- [ ] Check browser console for errors
- [ ] Verify `.htaccess` exists in admin folder
- [ ] Check API URL configuration

### If API Returns 502/503 Error:
- [ ] Check Node.js app status in cPanel
- [ ] Check application logs
- [ ] Verify MongoDB connection string
- [ ] Check `.env` file exists with correct values
- [ ] Restart app: `touch ~/backend/tmp/restart.txt`

### If Images Don't Load:
- [ ] Check uploads folder exists
- [ ] Verify folder permissions (755)
- [ ] Check FILE_UPLOAD_PATH in .env
- [ ] Verify backend can write to uploads folder

### If CORS Errors Appear:
- [ ] Check CORS_ORIGIN in backend .env
- [ ] Should match your domain exactly
- [ ] Restart backend after changing

---

## 📋 Post-Deployment

### 18. Security
- [ ] Change admin password from default
- [ ] Update JWT_SECRET to strong random value
- [ ] Remove .env.example from server
- [ ] Disable directory browsing
- [ ] Enable HTTPS only (redirect HTTP)

### 19. Performance
- [ ] Enable Gzip compression in cPanel
- [ ] Enable browser caching
- [ ] Optimize images in uploads folder
- [ ] Consider CDN for static assets

### 20. Monitoring
- [ ] Set up uptime monitoring (UptimeRobot - free)
- [ ] Monitor application logs regularly
- [ ] Set up error alerting
- [ ] Schedule regular backups

### 21. Backups
- [ ] Enable cPanel automatic backups
- [ ] Backup MongoDB Atlas database
- [ ] Download uploads folder backup locally
- [ ] Save .env file securely offline

---

## 🎉 Launch!

### 22. Go Live
- [ ] Test all features one final time
- [ ] Announce to users
- [ ] Monitor for issues first 24 hours
- [ ] Keep this checklist for future updates

---

## 📞 Need Help?

**GoDaddy doesn't support Node.js?**
→ See alternative deployment options in `CPANEL_DEPLOYMENT_GUIDE.md`

**Still having issues?**
→ Check the Troubleshooting section in deployment guide

**Want professional deployment?**
→ Consider managed hosting or VPS options

---

## 🔄 Future Updates

To update your site:
1. Make changes locally
2. Run `prepare-deployment.bat` again
3. Upload changed files to cPanel
4. Restart Node.js app: `touch ~/backend/tmp/restart.txt`

---

**Deployment Date**: _______________
**Domain**: _______________
**MongoDB Atlas Cluster**: _______________
**cPanel Username**: _______________

---

Good luck with your deployment! 🚀


# 🚀 cPanel Deployment Guide for GoDaddy

This guide will help you deploy your Pet E-Commerce Platform to GoDaddy cPanel hosting.

## ⚠️ Important Prerequisites

Your GoDaddy hosting plan **MUST** have:
1. **Node.js support** (check cPanel > Setup Node.js App)
2. **MongoDB** or access to MongoDB Atlas (cloud database)
3. **SSH access** (for easier file management)
4. Sufficient storage for the application and uploads

> **Note**: Most GoDaddy shared hosting plans do NOT support Node.js. You may need VPS or dedicated hosting. Check your plan first!

---

## 📋 Deployment Steps Overview

1. Build the frontend and admin applications
2. Set up MongoDB (Atlas recommended)
3. Upload files to cPanel
4. Configure Node.js application
5. Set up environment variables
6. Configure domains/subdomains
7. Start the application

---

## Step 1: Build Your Applications Locally

Before uploading, you need to build production versions of your frontend and admin:

### On Your Local Machine:

```bash
# Navigate to your project root
cd C:\Users\mmurt\Desktop\web

# Build frontend (customer website)
cd frontend
npm run build

# Build admin dashboard
cd ../admin
npm run build

# Build backend
cd ../backend
npm run build
```

This creates optimized production files in:
- `frontend/dist/` - Customer website
- `admin/dist/` - Admin dashboard
- `backend/dist/` - Backend API (JavaScript files)

---

## Step 2: Set Up MongoDB Database

### Option A: MongoDB Atlas (Recommended - Free Tier Available)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 free tier)
4. Create a database user (username + password)
5. Whitelist all IP addresses: `0.0.0.0/0` (for cPanel)
6. Get your connection string (looks like):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/petshop?retryWrites=true&w=majority
   ```

### Option B: cPanel MongoDB (if available)

Check if your GoDaddy cPanel has MongoDB under "Databases" section. If yes, create a database and user there.

---

## Step 3: Prepare Files for Upload

Create a deployment folder with this structure:

```
deployment/
├── public_html/          # For customer website
│   └── (contents of frontend/dist/)
├── admin/                # For admin dashboard
│   └── (contents of admin/dist/)
└── backend/              # For backend API
    ├── dist/             # Built backend files
    ├── node_modules/     # Will install on server
    ├── package.json
    ├── .env              # Environment variables
    └── uploads/          # Product images folder
```

### Create the deployment structure:

**On Windows PowerShell:**

```powershell
# Create deployment folder on desktop
mkdir C:\Users\mmurt\Desktop\deployment
mkdir C:\Users\mmurt\Desktop\deployment\public_html
mkdir C:\Users\mmurt\Desktop\deployment\admin
mkdir C:\Users\mmurt\Desktop\deployment\backend

# Copy frontend build
Copy-Item -Path "C:\Users\mmurt\Desktop\web\frontend\dist\*" -Destination "C:\Users\mmurt\Desktop\deployment\public_html\" -Recurse

# Copy admin build
Copy-Item -Path "C:\Users\mmurt\Desktop\web\admin\dist\*" -Destination "C:\Users\mmurt\Desktop\deployment\admin\" -Recurse

# Copy backend files
Copy-Item -Path "C:\Users\mmurt\Desktop\web\backend\dist" -Destination "C:\Users\mmurt\Desktop\deployment\backend\" -Recurse
Copy-Item -Path "C:\Users\mmurt\Desktop\web\backend\package.json" -Destination "C:\Users\mmurt\Desktop\deployment\backend\"

# Copy uploads folder (product images)
Copy-Item -Path "C:\Users\mmurt\Desktop\web\backend\uploads" -Destination "C:\Users\mmurt\Desktop\deployment\backend\" -Recurse
```

---

## Step 4: Upload to cPanel

### Method A: File Manager (Easier)

1. Login to your GoDaddy cPanel
2. Open **File Manager**
3. Navigate to your home directory (usually `/home/yourusername/`)
4. Upload the files:
   - Upload `public_html` contents → `/home/yourusername/public_html/`
   - Upload `admin` folder → `/home/yourusername/admin/`
   - Upload `backend` folder → `/home/yourusername/backend/`

### Method B: FTP (FileZilla)

1. Download FileZilla
2. Get FTP credentials from cPanel
3. Connect and upload folders as above

---

## Step 5: Configure Environment Variables

### Create `.env` file in backend folder

In cPanel File Manager, navigate to `/home/yourusername/backend/` and create `.env` file:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
API_URL=https://yourdomain.com/api

# Database - Use your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/petshop?retryWrites=true&w=majority

# JWT Secret - Change this to a random secure string
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string-min-32-chars
JWT_EXPIRE=7d

# Cookie Settings
JWT_COOKIE_EXPIRE=7

# File Upload
MAX_FILE_SIZE=5242880
FILE_UPLOAD_PATH=/home/yourusername/backend/uploads

# CORS - Your domain
CORS_ORIGIN=https://yourdomain.com

# Admin Email (for first login)
ADMIN_EMAIL=admin@petshiwu.com
ADMIN_PASSWORD=admin123
```

**Important**: Replace:
- `yourdomain.com` with your actual domain
- `MONGODB_URI` with your Atlas connection string
- `JWT_SECRET` with a random secure string
- `/home/yourusername/` with your actual cPanel username

---

## Step 6: Set Up Node.js Application in cPanel

1. In cPanel, find **Setup Node.js App** (or "Application Manager")

2. Click **Create Application**

3. Configure:
   - **Node.js version**: Select latest (18.x or higher)
   - **Application mode**: Production
   - **Application root**: `backend`
   - **Application URL**: Choose your domain or subdomain
   - **Application startup file**: `dist/server.js`
   - **Environment variables**: Add from .env file

4. Click **Create**

5. After creation, cPanel will show you a command to enter in terminal. It looks like:
   ```bash
   source /home/username/nodevenv/backend/18/bin/activate && cd /home/username/backend
   ```

---

## Step 7: Install Dependencies via SSH

### Enable SSH in cPanel:
1. Go to **SSH Access** in cPanel
2. Generate SSH keys if needed
3. Use **Terminal** in cPanel or a SSH client like PuTTY

### Connect and Install:

```bash
# Activate Node.js environment
source /home/yourusername/nodevenv/backend/18/bin/activate

# Navigate to backend
cd /home/yourusername/backend

# Install dependencies
npm install --production

# Restart the application
cd /home/yourusername
touch backend/tmp/restart.txt
```

---

## Step 8: Configure Frontend API Endpoints

The frontend and admin need to know where your backend API is located.

### Update frontend API configuration:

Before building (back on your local machine), edit these files:

**`frontend/src/services/api.ts`** - Update the API base URL:

```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://yourdomain.com/api'  // Change this
  : 'http://localhost:5000/api';
```

**`admin/src/services/api.ts`** - Update the API base URL:

```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://yourdomain.com/api'  // Change this
  : 'http://localhost:5000/api';
```

Then rebuild both:
```bash
npm run build:frontend
npm run build:admin
```

And re-upload the `dist` folders.

---

## Step 9: Configure Subdomains (Optional but Recommended)

For better organization:

### Setup:
1. **Customer Website**: `https://yourdomain.com` → `/public_html/`
2. **Admin Dashboard**: `https://admin.yourdomain.com` → `/admin/`
3. **Backend API**: `https://api.yourdomain.com` → Proxy to Node.js app

### Create Subdomains in cPanel:

1. Go to **Subdomains**
2. Create `admin.yourdomain.com` → Document root: `/home/yourusername/admin`
3. Create `api.yourdomain.com` → Will proxy to backend

### Create `.htaccess` for API subdomain:

In `/home/yourusername/public_html/api/.htaccess`:

```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:5000/api/$1 [P,L]
```

---

## Step 10: Configure .htaccess for React Router

Both frontend and admin use React Router, so they need proper .htaccess configuration.

### Frontend - `/public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Admin - `/admin/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Step 11: Set Up Database (Initial Seed)

After backend is running, you need to seed the database with initial data:

```bash
# SSH into your server
ssh yourusername@yourdomain.com

# Activate Node.js environment
source /home/yourusername/nodevenv/backend/18/bin/activate

# Navigate to backend
cd /home/yourusername/backend

# Run seed script
npm run seed

# This creates:
# - Admin user (admin@petshiwu.com / admin123)
# - Sample products
# - Categories
# - Pet types
```

---

## Step 12: SSL Certificate (HTTPS)

1. In cPanel, go to **SSL/TLS Status**
2. Enable AutoSSL (Let's Encrypt) for your domain
3. Wait 10-15 minutes for certificates to issue
4. Your site will be accessible via HTTPS

---

## 🎯 Final URLs

After deployment, your application will be accessible at:

- **Customer Website**: `https://yourdomain.com`
- **Admin Dashboard**: `https://yourdomain.com/admin` (or `https://admin.yourdomain.com`)
- **Backend API**: `https://yourdomain.com/api` (or `https://api.yourdomain.com`)

---

## 📱 Testing Your Deployment

1. Visit `https://yourdomain.com` - Should show customer website
2. Visit `https://yourdomain.com/admin` - Should show admin login
3. Login with: `admin@petshiwu.com` / `admin123`
4. Test API: `https://yourdomain.com/api/products`

---

## 🐛 Troubleshooting

### Backend not starting?
- Check Node.js app logs in cPanel
- Verify MongoDB connection string
- Check file permissions (755 for folders, 644 for files)

### Frontend shows blank page?
- Check browser console for errors
- Verify API URL is correct
- Check .htaccess files

### Images not loading?
- Check uploads folder permissions (755)
- Verify FILE_UPLOAD_PATH in .env
- Ensure uploads folder exists in backend

### Database connection error?
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Test connection string locally first
- Check database user permissions

### API CORS errors?
- Update CORS_ORIGIN in .env to match your domain
- Rebuild and restart backend

---

## 📝 Important Notes

1. **Shared Hosting Limitations**: 
   - GoDaddy shared hosting may not support Node.js
   - Consider upgrading to VPS or dedicated server
   - Or use alternatives like Vercel (frontend) + Railway (backend)

2. **File Upload Limits**:
   - Check cPanel upload limits
   - Adjust MAX_FILE_SIZE in .env accordingly

3. **Performance**:
   - Shared hosting may be slower than dedicated servers
   - Consider CDN for images and static assets
   - Enable caching in cPanel

4. **Backups**:
   - Regularly backup your database
   - Keep backups of uploads folder
   - Use cPanel backup tools

5. **Updates**:
   - To update code, rebuild locally and re-upload
   - Use `touch tmp/restart.txt` to restart Node.js app

---

## 🆘 Alternative Deployment Options

If GoDaddy cPanel doesn't support Node.js well, consider:

### Option 1: Split Deployment
- **Frontend + Admin**: GoDaddy cPanel (static files)
- **Backend + Database**: Railway, Render, or Heroku (free/cheap)

### Option 2: Full Cloud Deployment
- **Vercel**: Frontend + Admin (free)
- **Railway/Render**: Backend (free tier)
- **MongoDB Atlas**: Database (free tier)

### Option 3: VPS
- **DigitalOcean**: $6/month droplet
- **Linode**: $5/month VPS
- **Vultr**: $5/month instance

Let me know if you need help with alternative deployment!

---

## 📞 Need Help?

If you run into issues:
1. Check GoDaddy support for Node.js availability
2. Review application logs in cPanel
3. Test API endpoints with Postman
4. Check browser console for frontend errors

Good luck with your deployment! 🚀


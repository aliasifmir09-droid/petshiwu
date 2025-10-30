# ⚡ Quick Start - Deploy to cPanel in 30 Minutes

This is the condensed version. For complete details, see `CPANEL_DEPLOYMENT_GUIDE.md`.

---

## ⚠️ Prerequisites Check (2 mins)

1. **Does your GoDaddy plan support Node.js?**
   - Login to cPanel
   - Look for "Setup Node.js App" or "Node.js Selector"
   - ❌ **NOT FOUND?** → Your plan won't work. See alternatives at end.
   - ✅ **FOUND?** → Continue below!

2. **What's your domain?**
   - Write it down: `_______________________`

---

## 🚀 Step-by-Step Deployment

### Step 1: Setup MongoDB (5 mins)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account → Create cluster (M0 Free)
3. Database Access → Add user → Save username/password
4. Network Access → Add IP: `0.0.0.0/0` (allow all)
5. Connect → Get connection string:
   ```
   mongodb+srv://username:password@cluster.xxxxx.mongodb.net/petshop
   ```
6. Save this string for later! ✍️

---

### Step 2: Configure & Build (5 mins)

**On your local computer:**

1. **Create frontend production config:**
   ```powershell
   # Copy example file
   copy frontend\.env.production.example frontend\.env.production
   
   # Edit frontend/.env.production
   # Change: VITE_API_URL=https://YOURDOMAIN.com/api
   ```

2. **Create admin production config:**
   ```powershell
   # Copy example file
   copy admin\.env.production.example admin\.env.production
   
   # Edit admin/.env.production
   # Change: VITE_API_URL=https://YOURDOMAIN.com/api
   ```

3. **Run the build script:**
   ```powershell
   # Windows
   prepare-deployment.bat
   
   # Mac/Linux
   bash prepare-deployment.sh
   ```

4. **Configure backend .env:**
   - Go to `Desktop/deployment/backend/`
   - Edit `.env.example`
   - Update these (IMPORTANT!):
     - `MONGODB_URI` → Your Atlas connection string from Step 1
     - `JWT_SECRET` → Any random long string (e.g., `my-super-secret-key-for-production-2024`)
     - `API_URL` → `https://YOURDOMAIN.com/api`
     - `CORS_ORIGIN` → `https://YOURDOMAIN.com`
     - `FILE_UPLOAD_PATH` → `/home/YOURCPANELUSERNAME/backend/uploads`
   - Save as `.env` (remove .example)

---

### Step 3: Upload to cPanel (10 mins)

1. **Login to GoDaddy cPanel**

2. **Open File Manager**

3. **Upload Frontend (Customer Site):**
   - Navigate to `/home/yourusername/public_html/`
   - Delete existing files (if fresh install)
   - Upload ALL from `Desktop/deployment/public_html/`
   - Includes: index.html, assets folder, .htaccess

4. **Upload Admin Dashboard:**
   - Create folder: `/home/yourusername/admin/`
   - Upload ALL from `Desktop/deployment/admin/`
   - Includes: index.html, assets folder, .htaccess

5. **Upload Backend:**
   - Create folder: `/home/yourusername/backend/`
   - Upload ALL from `Desktop/deployment/backend/`
   - Must include: `dist/`, `package.json`, `.env`, `uploads/`

---

### Step 4: Setup Node.js App (5 mins)

1. **In cPanel, find "Setup Node.js App"**

2. **Click "Create Application"**

3. **Fill in these EXACTLY:**
   - Node.js version: `18.x` (or latest available)
   - Application mode: `Production`
   - Application root: `backend`
   - Application URL: `https://YOURDOMAIN.com`
   - Application startup file: `dist/server.js`

4. **Click "Create"**

5. **You'll see a command like this - COPY IT:**
   ```bash
   source /home/username/nodevenv/backend/18/bin/activate && cd /home/username/backend
   ```

---

### Step 5: Install & Start (5 mins)

1. **In cPanel, open "Terminal"**

2. **Paste the command you copied** (activates Node.js)

3. **Install dependencies:**
   ```bash
   cd ~/backend
   npm install --production
   ```
   (This takes 2-3 minutes)

4. **Seed the database:**
   ```bash
   npm run seed
   ```
   (Creates admin user and sample data)

5. **Restart the app:**
   ```bash
   touch ~/backend/tmp/restart.txt
   ```

---

### Step 6: Enable SSL (3 mins)

1. **In cPanel → SSL/TLS Status**
2. **Click "Run AutoSSL"**
3. **Wait 10-15 minutes for certificate**
4. **Verify HTTPS works**

---

### Step 7: Test Everything (5 mins)

✅ **Test Customer Site:**
- Visit: `https://YOURDOMAIN.com`
- Should show homepage with products

✅ **Test Admin:**
- Visit: `https://YOURDOMAIN.com/admin`
- Login: `admin@petshiwu.com` / `admin123`
- Should show dashboard

✅ **Test API:**
- Visit: `https://YOURDOMAIN.com/api/products`
- Should return JSON data

✅ **Test Features:**
- [ ] Browse products
- [ ] Add to cart
- [ ] Admin can login
- [ ] Admin can view dashboard

---

## 🎉 Done! Your Site is Live!

**URLs:**
- Customer Site: `https://YOURDOMAIN.com`
- Admin Panel: `https://YOURDOMAIN.com/admin`
- API: `https://YOURDOMAIN.com/api`

**Admin Login:**
- Email: `admin@petshiwu.com`
- Password: `admin123`
- **⚠️ CHANGE THIS PASSWORD IMMEDIATELY!**

---

## 🐛 Common Issues

### "Cannot GET /api"
→ Node.js app not running. Check cPanel → Setup Node.js App → Restart

### "500 Internal Server Error"
→ Check backend .env file has correct MongoDB URI

### "CORS Error" in browser
→ CORS_ORIGIN in .env must match your domain exactly

### Blank page
→ Check browser console (F12). Likely wrong API URL in .env.production

### Images not loading
→ Check uploads folder permissions: 755

---

## 🚨 If GoDaddy Doesn't Support Node.js

### Alternative: Split Deployment (FREE!)

**Frontend + Admin** → Keep on GoDaddy (static files)
**Backend** → Deploy to Railway/Render (free tier)

1. **Deploy Backend to Railway:**
   - Go to [Railway.app](https://railway.app)
   - Sign up with GitHub
   - New Project → Deploy from GitHub
   - Add MongoDB plugin
   - Deploy backend folder
   - Get your API URL (e.g., `https://yourapp.railway.app`)

2. **Update Frontend/Admin .env.production:**
   ```env
   VITE_API_URL=https://yourapp.railway.app/api
   ```

3. **Rebuild and upload to GoDaddy:**
   - Run `prepare-deployment.bat` again
   - Upload only `public_html` and `admin` folders
   - Skip backend folder

---

## 📚 Need More Help?

- **Full Guide**: See `CPANEL_DEPLOYMENT_GUIDE.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Troubleshooting**: Check backend logs in cPanel

---

**Next Steps After Deployment:**

1. ✅ Change admin password
2. ✅ Add your products
3. ✅ Customize site content
4. ✅ Test checkout process
5. ✅ Set up backups
6. ✅ Monitor site performance

Good luck! 🚀


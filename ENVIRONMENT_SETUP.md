# 🔧 Environment Configuration for Production

Before deploying, you need to create production environment files for frontend and admin.

---

## Frontend Environment

**Create file: `frontend/.env.production`**

```env
# Frontend Production Environment Variables
# API URL - Update with your actual domain
VITE_API_URL=https://yourdomain.com/api

# OR if using subdomain for API:
# VITE_API_URL=https://api.yourdomain.com
```

---

## Admin Environment

**Create file: `admin/.env.production`**

```env
# Admin Production Environment Variables
# API URL - Update with your actual domain
VITE_API_URL=https://yourdomain.com/api

# OR if using subdomain for API:
# VITE_API_URL=https://api.yourdomain.com
```

---

## Backend Environment

**Create file: `backend/.env`** (on your cPanel server)

```env
# Server Configuration
NODE_ENV=production
PORT=5000
API_URL=https://yourdomain.com/api

# Database - Use your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/petshop?retryWrites=true&w=majority

# JWT Secret - IMPORTANT: Change this to a random secure string (min 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string-min-32-chars
JWT_EXPIRE=7d

# Cookie Settings
JWT_COOKIE_EXPIRE=7

# File Upload
MAX_FILE_SIZE=5242880
FILE_UPLOAD_PATH=/home/yourusername/backend/uploads

# CORS - Your domain (must match exactly)
CORS_ORIGIN=https://yourdomain.com

# Admin Email (for initial seed)
ADMIN_EMAIL=admin@petshiwu.com
ADMIN_PASSWORD=admin123
```

---

## 📝 Instructions

### Before Building (Local Machine)

1. **Create frontend/.env.production:**
   ```bash
   # Windows PowerShell
   New-Item -Path "frontend\.env.production" -ItemType File
   
   # Then edit and add:
   # VITE_API_URL=https://yourdomain.com/api
   ```

2. **Create admin/.env.production:**
   ```bash
   # Windows PowerShell
   New-Item -Path "admin\.env.production" -ItemType File
   
   # Then edit and add:
   # VITE_API_URL=https://yourdomain.com/api
   ```

3. **Update with YOUR domain** in both files

4. **Run deployment script** - it will use these .env files during build

---

### After Uploading (cPanel Server)

1. The `prepare-deployment.bat` script creates `.env.example` in backend

2. Edit `/home/yourusername/backend/.env.example` with your settings

3. Rename to `.env` (remove .example)

---

## 🔐 Security Notes

**IMPORTANT:**
- Never commit `.env` files to Git
- Use strong random JWT_SECRET (32+ characters)
- Keep MongoDB credentials secure
- Change default admin password after first login

**Generate Random JWT Secret:**

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Online
# Visit: https://randomkeygen.com/
# Use "Fort Knox Passwords" section
```

---

## 🌐 Domain Configuration Examples

### Example 1: Single Domain
```env
# Frontend & Admin
VITE_API_URL=https://petshop.com/api

# Backend
API_URL=https://petshop.com/api
CORS_ORIGIN=https://petshop.com
```

### Example 2: With Subdomains
```env
# Frontend
VITE_API_URL=https://api.petshop.com

# Admin
VITE_API_URL=https://api.petshop.com

# Backend
API_URL=https://api.petshop.com
CORS_ORIGIN=https://petshop.com,https://admin.petshop.com
```

### Example 3: Split Deployment (Railway Backend)
```env
# Frontend & Admin
VITE_API_URL=https://my-petshop.railway.app/api

# Backend (on Railway)
API_URL=https://my-petshop.railway.app/api
CORS_ORIGIN=https://petshop.com
```

---

## ✅ Verification Checklist

Before building:
- [ ] `frontend/.env.production` exists with correct VITE_API_URL
- [ ] `admin/.env.production` exists with correct VITE_API_URL
- [ ] Both use YOUR actual domain (not example domain)
- [ ] URLs start with `https://` (not http://)
- [ ] No trailing slashes in URLs

Before deploying backend:
- [ ] MongoDB Atlas cluster created
- [ ] Connection string copied
- [ ] Database user created with password
- [ ] IP whitelist includes `0.0.0.0/0`
- [ ] JWT_SECRET is strong and random
- [ ] CORS_ORIGIN matches your domain exactly
- [ ] FILE_UPLOAD_PATH uses correct cPanel username

---

## 🔄 After Deployment

If you need to change environment variables:

**Frontend/Admin:**
1. Update `.env.production` locally
2. Rebuild: `npm run build`
3. Re-upload `dist` folder to cPanel

**Backend:**
1. Edit `.env` in cPanel File Manager
2. Save changes
3. Restart app: `touch ~/backend/tmp/restart.txt`

---

## 📞 Troubleshooting

**"VITE_API_URL is not defined"**
→ Create `.env.production` files before building

**"CORS Error"**
→ Check CORS_ORIGIN matches your domain exactly (case-sensitive)

**"Cannot connect to database"**
→ Verify MongoDB Atlas connection string and IP whitelist

**"401 Unauthorized"**
→ Check JWT_SECRET is same across all requests

**"Files not uploading"**
→ Check FILE_UPLOAD_PATH and uploads folder permissions

---

Need help? Check `CPANEL_DEPLOYMENT_GUIDE.md` for detailed instructions.


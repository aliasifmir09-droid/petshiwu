# 🚀 Local Development Setup Guide

## 📋 Prerequisites

Before starting, make sure you have:

1. **Node.js** v18 or higher
   - Download from: https://nodejs.org/
   - Verify: `node --version` (should show v18+)

2. **MongoDB** (choose one):
   - **Option A**: MongoDB Atlas (Cloud - Free tier available)
   - **Option B**: MongoDB Community Server (Local)
     - Download from: https://www.mongodb.com/try/download/community
     - Or use Docker: `docker run -d -p 27017:27017 mongo`

3. **Git** (if cloning from repository)
   - Download from: https://git-scm.com/

## 🔧 Step-by-Step Setup

### Step 1: Install Dependencies

Open PowerShell or Command Prompt in the project folder:

```bash
# Install all dependencies (root, frontend, admin, backend)
npm run install:all
```

Or install individually:
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..

# Admin dependencies
cd admin
npm install
cd ..
```

### Step 2: Configure Environment Variables

#### Backend Configuration

Create `backend/.env` file:

```bash
cd backend
# Copy example if exists, or create new
```

Add these variables to `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
# Option A: MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pet-shop-dev

# Option B: Local MongoDB
# MONGODB_URI=mongodb://127.0.0.1:27017/pet-shop-dev

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174

# Email (Optional - for development, you can use a test service)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary (Optional - for image uploads)
# If not configured, images will be stored locally
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Frontend Configuration

Create `frontend/.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

#### Admin Configuration

Create `admin/.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start MongoDB (If Using Local MongoDB)

**If using MongoDB Atlas (Cloud)**: Skip this step - it's already running in the cloud.

**If using Local MongoDB**:

**Windows:**
```bash
# If installed as service, it should start automatically
# Or start manually:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Or using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

Verify MongoDB is running:
```bash
mongosh
# or
mongo
```

### Step 4: Seed Database (Optional - Creates Sample Data)

```bash
cd backend
npm run seed
```

This creates:
- Admin user: `admin@petshiwu.com` / `admin123`
- Sample products, categories, pet types

**⚠️ WARNING**: This deletes all existing data! Only run on a fresh/development database.

### Step 5: Start All Services

**Option A: Run All at Once (Recommended)**

From project root:
```bash
npm run dev
```

This starts:
- 🔧 Backend API: http://localhost:5000
- 🛍️ Customer Website: http://localhost:5173
- 👨‍💼 Admin Dashboard: http://localhost:5174

**Option B: Run Individually (3 Separate Terminals)**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Admin:**
```bash
cd admin
npm run dev
```

## 🌐 Access URLs

Once running, access:

| Service | URL | Description |
|---------|-----|-------------|
| Customer Website | http://localhost:5173 | Main shopping site |
| Admin Dashboard | http://localhost:5174 | Admin panel |
| Backend API | http://localhost:5000/api | API endpoints |
| API Docs | http://localhost:5000/api-docs | Swagger documentation |

## 🔑 Default Login Credentials

After seeding:

**Admin:**
- Email: `admin@petshiwu.com`
- Password: `admin123`

**Customer (if seeded):**
- Email: `customer@example.com`
- Password: `password123`

## 🛠️ Development Features

- ✅ **Hot Reload**: Changes auto-refresh in browser
- ✅ **TypeScript**: Type checking enabled
- ✅ **Error Overlay**: Errors shown in browser
- ✅ **API Proxy**: Frontend proxies to backend automatically

## 🐛 Troubleshooting

### Port Already in Use

If port 5000, 5173, or 5174 is already in use:

**Backend (port 5000):**
```bash
# Change in backend/.env
PORT=5001
```

**Frontend (port 5173):**
```bash
# Change in frontend/vite.config.ts or use:
cd frontend
npm run dev -- --port 5175
```

**Admin (port 5174):**
```bash
# Change in admin/vite.config.ts or use:
cd admin
npm run dev -- --port 5176
```

### MongoDB Connection Error

**Error**: `MongoServerError: Authentication failed`

**Solution**: Check your `MONGODB_URI` in `backend/.env`
- For Atlas: Make sure username/password are correct
- For Local: Remove username/password if not using auth

**Error**: `MongoServerSelectionError: connect ECONNREFUSED`

**Solution**: 
- Check if MongoDB is running
- Verify connection string
- Check firewall settings

### Module Not Found Errors

```bash
# Delete node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install

cd ../admin
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Rebuild TypeScript
cd backend
npm run build
```

## 📝 Quick Reference Commands

```bash
# Install all dependencies
npm run install:all

# Start all services
npm run dev

# Start individually
npm run dev:backend
npm run dev:frontend
npm run dev:admin

# Seed database (WARNING: Deletes all data!)
cd backend
npm run seed

# Build for production
npm run build

# Check database state
cd backend
node scripts/check-database-state.js
```

## ✅ Verification Checklist

- [ ] Node.js v18+ installed
- [ ] MongoDB running (Atlas or Local)
- [ ] All dependencies installed (`npm run install:all`)
- [ ] Environment variables configured (`.env` files)
- [ ] Database seeded (optional)
- [ ] All services running (`npm run dev`)
- [ ] Can access http://localhost:5173 (Customer site)
- [ ] Can access http://localhost:5174 (Admin dashboard)
- [ ] Can access http://localhost:5000/api (Backend API)

## 🎯 Next Steps

1. **Make Changes**: Edit code in `frontend/src/`, `admin/src/`, or `backend/src/`
2. **See Changes**: Browser auto-refreshes (hot reload)
3. **Test Features**: Use the admin dashboard to add products, manage orders, etc.
4. **Check Logs**: Backend logs show in terminal, frontend errors in browser console

---

**You're all set! Start developing!** 🚀


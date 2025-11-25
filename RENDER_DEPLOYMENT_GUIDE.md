# 🚀 Complete Render Deployment Guide (New Account)

This guide will help you deploy your pet shop e-commerce platform to a **new Render account** from scratch.

---

## 📋 Prerequisites

Before starting, make sure you have:

1. ✅ **GitHub Account** - Your code is already on GitHub
2. ✅ **Render Account** - Sign up at [render.com](https://render.com) (free tier available)
3. ✅ **MongoDB Atlas Account** - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
4. ✅ **Stripe Account** (Optional) - For donation payments - Sign up at [stripe.com](https://stripe.com)

---

## 🗄️ Step 1: Set Up MongoDB Atlas

### 1.1 Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click **"Build a Database"**
4. Choose **FREE** tier (M0 Sandbox)
5. Select a cloud provider and region (closest to your users)
6. Click **"Create"**

### 1.2 Configure Database Access

1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username (e.g., `petshop-admin`)
5. Generate a secure password (save it!)
6. Set privileges to **"Atlas admin"** or **"Read and write to any database"**
7. Click **"Add User"**

### 1.3 Configure Network Access

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for Render deployment)
   - Or add Render's IP ranges if you want to restrict
4. Click **"Confirm"**

### 1.4 Get Connection String

1. Go to **Database** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
5. **Replace `<password>`** with your database user password
6. **Add database name** at the end: `?retryWrites=true&w=majority` → `?retryWrites=true&w=majority&appName=pet-shop`
   - Final format: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/petshop?retryWrites=true&w=majority`

**Save this connection string** - you'll need it for Render!

---

## 🔐 Step 2: Generate JWT Secret

Generate a secure JWT secret (minimum 32 characters):

**Option 1: Online Generator**
- Visit: https://generate-secret.vercel.app/32
- Copy the generated secret

**Option 2: Command Line**
```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Save this JWT secret** - you'll need it for Render!

---

## 💳 Step 3: Set Up Stripe (Optional - For Donations)

If you want donation payments to work:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up or log in
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_`)
5. Copy your **Secret key** (starts with `sk_`) - Click "Reveal test key"
6. For webhooks, go to **Developers** → **Webhooks**
7. Click **"Add endpoint"**
8. Enter your backend URL: `https://your-backend-url.onrender.com/api/donations/webhook`
9. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
10. Copy the **Webhook signing secret** (starts with `whsec_`)

**Save these values** for Render environment variables!

---

## 🎯 Step 4: Connect GitHub to Render

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"** (if using render.yaml) OR **"Web Service"** (manual setup)
3. Connect your GitHub account if not already connected
4. Select your repository: `mirmurtaza110/pet-shop`
5. Choose the branch: `main`

---

## 🔧 Step 5: Deploy Backend API

### 5.1 Create Backend Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `mirmurtaza110/pet-shop`
3. Configure the service:
   - **Name**: `pet-shop-api` (or any name you prefer)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci --include=dev && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose paid for better performance)

### 5.2 Set Backend Environment Variables

Click **"Environment"** tab and add these variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/petshop?retryWrites=true&w=majority
JWT_SECRET=your-32-character-secret-key-here
CORS_ORIGIN=https://pet-shop-frontend.onrender.com,https://pet-shop-admin.onrender.com
ADMIN_EMAIL=admin@petshiwu.com
ADMIN_PASSWORD=your-secure-admin-password-here
```

**For Stripe (Optional):**
```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Important Notes:**
- Replace `MONGODB_URI` with your actual MongoDB connection string
- Replace `JWT_SECRET` with your generated secret (32+ characters)
- Replace `ADMIN_PASSWORD` with a secure password
- For `CORS_ORIGIN`, use placeholder URLs for now - we'll update after frontend/admin deploy
- If using Stripe, add the keys (use test keys for testing)

### 5.3 Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment to complete (5-10 minutes)
3. **Copy the service URL** (e.g., `https://pet-shop-api-xxxx.onrender.com`)
4. Test the API: Visit `https://your-backend-url.onrender.com/api` - should show API info

---

## 🎨 Step 6: Deploy Frontend (Customer Website)

### 6.1 Create Frontend Service

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect your GitHub repository: `mirmurtaza110/pet-shop`
3. Configure the service:
   - **Name**: `pet-shop-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`

### 6.2 Set Frontend Environment Variables

Click **"Environment"** tab and add:

```env
VITE_API_URL=https://pet-shop-api-xxxx.onrender.com/api
```

**Important:**
- Replace `pet-shop-api-xxxx` with your actual backend service URL
- **Must include `/api` at the end**

### 6.3 Deploy Frontend

1. Click **"Create Static Site"**
2. Wait for deployment (3-5 minutes)
3. **Copy the service URL** (e.g., `https://pet-shop-frontend-xxxx.onrender.com`)

---

## 👨‍💼 Step 7: Deploy Admin Dashboard

### 7.1 Create Admin Service

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect your GitHub repository: `mirmurtaza110/pet-shop`
3. Configure the service:
   - **Name**: `pet-shop-admin`
   - **Branch**: `main`
   - **Root Directory**: `admin`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`

### 7.2 Set Admin Environment Variables

Click **"Environment"** tab and add:

```env
VITE_API_URL=https://pet-shop-api-xxxx.onrender.com/api
```

**Important:**
- Use the **same backend URL** as frontend
- **Must include `/api` at the end**

### 7.3 Deploy Admin

1. Click **"Create Static Site"**
2. Wait for deployment (3-5 minutes)
3. **Copy the service URL** (e.g., `https://pet-shop-admin-xxxx.onrender.com`)

---

## 🔄 Step 8: Update CORS Settings

Now that all services are deployed, update the backend CORS:

1. Go to **Backend Service** → **Environment** tab
2. Update `CORS_ORIGIN` with your actual URLs:

```env
CORS_ORIGIN=https://pet-shop-frontend-xxxx.onrender.com,https://pet-shop-admin-xxxx.onrender.com
```

3. Click **"Save Changes"**
4. Go to **Manual Deploy** → **"Deploy latest commit"** (to restart with new CORS)

---

## 🌱 Step 9: Seed the Database

After backend is deployed, you need to seed the database with initial data:

### Option 1: Using Render Shell (Recommended)

1. Go to **Backend Service** → **Shell** tab
2. Run:
```bash
npm run seed
```

### Option 2: Using Local Machine

1. Clone your repo locally
2. Create `.env` file in `backend/` with your production values
3. Run:
```bash
cd backend
npm install
npm run seed
```

**This will create:**
- Admin user (email from `ADMIN_EMAIL`, password from `ADMIN_PASSWORD`)
- Sample products
- Sample categories
- Sample pet types

---

## ✅ Step 10: Test Your Deployment

### 10.1 Test Backend API

1. Visit: `https://your-backend-url.onrender.com/api`
   - Should show API information
2. Test health endpoint: `https://your-backend-url.onrender.com/api/health` (if available)

### 10.2 Test Frontend

1. Visit: `https://your-frontend-url.onrender.com`
2. Should see the homepage
3. Try:
   - Browse products
   - Add to cart
   - Sign up / Sign in

### 10.3 Test Admin Dashboard

1. Visit: `https://your-admin-url.onrender.com`
2. Log in with:
   - **Email**: (from `ADMIN_EMAIL` env var)
   - **Password**: (from `ADMIN_PASSWORD` env var)
3. Should see the dashboard

---

## 🔧 Step 11: Configure Stripe Webhook (If Using Donations)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Webhooks**
2. Find your webhook endpoint
3. Click **"Add endpoint"** or edit existing
4. Enter: `https://your-backend-url.onrender.com/api/donations/webhook`
5. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
6. Copy the **Webhook signing secret**
7. Update in Render → Backend → Environment:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```
8. Redeploy backend

---

## 📝 Environment Variables Checklist

### Backend (Required)
- ✅ `NODE_ENV=production`
- ✅ `PORT=5000`
- ✅ `MONGODB_URI` - Your MongoDB connection string
- ✅ `JWT_SECRET` - 32+ character secret
- ✅ `CORS_ORIGIN` - Comma-separated frontend/admin URLs
- ✅ `ADMIN_EMAIL` - Admin login email
- ✅ `ADMIN_PASSWORD` - Admin login password

### Backend (Optional - For Donations)
- ⚪ `STRIPE_SECRET_KEY` - Stripe secret key
- ⚪ `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

### Frontend (Required)
- ✅ `VITE_API_URL` - Backend API URL (with `/api`)

### Admin (Required)
- ✅ `VITE_API_URL` - Backend API URL (with `/api`)

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check:**
1. Environment variables are set correctly
2. MongoDB connection string is valid
3. JWT_SECRET is 32+ characters
4. Check **Logs** tab in Render for errors

**Common Issues:**
- `MONGODB_URI` missing → Add it in Environment tab
- `JWT_SECRET` too short → Generate a longer one
- MongoDB connection failed → Check network access in Atlas

### Frontend/Admin Shows Blank Page

**Check:**
1. `VITE_API_URL` is set correctly
2. Backend is running and accessible
3. CORS is configured correctly
4. Check browser console for errors

**Common Issues:**
- `VITE_API_URL` missing → Add it
- CORS error → Update `CORS_ORIGIN` in backend
- API URL wrong → Must end with `/api`

### Build Failures

**Check:**
1. **Logs** tab shows specific error
2. TypeScript errors → Fix in code
3. Missing dependencies → Check `package.json`

**Common Issues:**
- TypeScript compilation errors → Fix code
- Missing `node_modules` → Check build command includes `npm ci`

### Database Connection Issues

**Check:**
1. MongoDB Atlas network access allows Render IPs
2. Connection string is correct
3. Database user has correct permissions
4. Password in connection string is URL-encoded

**Fix:**
- In MongoDB Atlas → Network Access → Allow from anywhere
- Double-check connection string format

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` files** to GitHub
2. ✅ **Use strong passwords** for admin and database
3. ✅ **Rotate JWT_SECRET** periodically
4. ✅ **Use environment variables** for all secrets
5. ✅ **Enable MongoDB IP whitelist** (if possible)
6. ✅ **Use HTTPS** (Render provides SSL automatically)
7. ✅ **Keep dependencies updated** (`npm audit`)

---

## 📊 Monitoring & Maintenance

### View Logs

- **Backend**: Render Dashboard → Backend Service → **Logs** tab
- **Frontend/Admin**: Render Dashboard → Service → **Logs** tab

### Update Deployment

1. Push changes to GitHub `main` branch
2. Render will auto-deploy (if enabled)
3. Or manually deploy: **Manual Deploy** → **Deploy latest commit**

### Database Backups

- MongoDB Atlas provides automatic backups on paid plans
- Free tier: Manual exports recommended
- Export: MongoDB Atlas → Clusters → ... → Export

---

## 🎉 You're Done!

Your pet shop e-commerce platform is now live on Render!

### Your Live URLs:
- **Frontend**: `https://pet-shop-frontend-xxxx.onrender.com`
- **Admin**: `https://pet-shop-admin-xxxx.onrender.com`
- **API**: `https://pet-shop-api-xxxx.onrender.com`

### Next Steps:
1. ✅ Test all functionality
2. ✅ Set up custom domain (optional)
3. ✅ Configure email notifications (if needed)
4. ✅ Set up monitoring/alerts
5. ✅ Regular backups

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Stripe Docs**: https://stripe.com/docs

---

**Last Updated**: $(date)
**Version**: 1.0.0


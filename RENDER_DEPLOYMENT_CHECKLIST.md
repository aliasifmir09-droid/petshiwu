# ✅ Render Deployment Checklist

Quick step-by-step checklist for deploying to a new Render account.

---

## Pre-Deployment Setup

- [ ] **MongoDB Atlas Account Created**
  - [ ] Cluster created (Free M0 tier)
  - [ ] Database user created (username + password saved)
  - [ ] Network access configured (Allow from anywhere)
  - [ ] Connection string copied and password replaced

- [ ] **JWT Secret Generated**
  - [ ] 32+ character secret generated
  - [ ] Saved securely

- [ ] **Stripe Account Setup** (Optional - for donations)
  - [ ] Account created
  - [ ] API keys copied (Secret key + Publishable key)
  - [ ] Webhook endpoint ready

- [ ] **Render Account Created**
  - [ ] Account signed up at render.com
  - [ ] GitHub connected to Render

---

## Backend Deployment

- [ ] **Backend Service Created**
  - [ ] New Web Service created
  - [ ] Repository connected: `mirmurtaza110/pet-shop`
  - [ ] Branch: `main`
  - [ ] Root Directory: `backend`
  - [ ] Build Command: `npm ci --include=dev && npm run build`
  - [ ] Start Command: `npm start`
  - [ ] Plan: Free (or paid)

- [ ] **Backend Environment Variables Set**
  ```env
  NODE_ENV=production
  PORT=5000
  MONGODB_URI=✅ (your MongoDB connection string)
  JWT_SECRET=✅ (your 32+ char secret)
  CORS_ORIGIN=✅ (placeholder URLs - update after frontend/admin deploy)
  ADMIN_EMAIL=✅ (your admin email)
  ADMIN_PASSWORD=✅ (your secure password)
  ```
  - [ ] All variables added
  - [ ] Values verified

- [ ] **Stripe Variables** (Optional)
  ```env
  STRIPE_SECRET_KEY=✅
  STRIPE_WEBHOOK_SECRET=✅
  ```
  - [ ] Added if using donations

- [ ] **Backend Deployed**
  - [ ] Service created successfully
  - [ ] Deployment completed
  - [ ] Backend URL copied: `https://________.onrender.com`
  - [ ] API tested: `https://your-backend-url.onrender.com/api`

---

## Frontend Deployment

- [ ] **Frontend Service Created**
  - [ ] New Static Site created
  - [ ] Repository: `mirmurtaza110/pet-shop`
  - [ ] Branch: `main`
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `npm ci && npm run build`
  - [ ] Publish Directory: `dist`

- [ ] **Frontend Environment Variables Set**
  ```env
  VITE_API_URL=✅ https://your-backend-url.onrender.com/api
  ```
  - [ ] Backend URL added (with `/api` at end)

- [ ] **Frontend Deployed**
  - [ ] Service created successfully
  - [ ] Deployment completed
  - [ ] Frontend URL copied: `https://________.onrender.com`
  - [ ] Website tested and working

---

## Admin Dashboard Deployment

- [ ] **Admin Service Created**
  - [ ] New Static Site created
  - [ ] Repository: `mirmurtaza110/pet-shop`
  - [ ] Branch: `main`
  - [ ] Root Directory: `admin`
  - [ ] Build Command: `npm ci && npm run build`
  - [ ] Publish Directory: `dist`

- [ ] **Admin Environment Variables Set**
  ```env
  VITE_API_URL=✅ https://your-backend-url.onrender.com/api
  ```
  - [ ] Backend URL added (same as frontend)

- [ ] **Admin Deployed**
  - [ ] Service created successfully
  - [ ] Deployment completed
  - [ ] Admin URL copied: `https://________.onrender.com`

---

## Post-Deployment Configuration

- [ ] **CORS Updated**
  - [ ] Backend → Environment → `CORS_ORIGIN` updated with actual URLs
  - [ ] Backend redeployed

- [ ] **Database Seeded**
  - [ ] Backend Shell accessed OR local seed run
  - [ ] `npm run seed` executed
  - [ ] Admin user created
  - [ ] Sample data loaded

- [ ] **Stripe Webhook Configured** (If using donations)
  - [ ] Webhook endpoint added in Stripe Dashboard
  - [ ] URL: `https://your-backend-url.onrender.com/api/donations/webhook`
  - [ ] Events selected: `payment_intent.succeeded`, `payment_intent.payment_failed`
  - [ ] Webhook secret copied to Render environment variables
  - [ ] Backend redeployed

---

## Testing & Verification

- [ ] **Backend API**
  - [ ] API endpoint accessible: `/api`
  - [ ] Health check working (if available)
  - [ ] No errors in logs

- [ ] **Frontend Website**
  - [ ] Homepage loads
  - [ ] Products display
  - [ ] Can browse categories
  - [ ] Can add to cart
  - [ ] Can sign up / sign in
  - [ ] No console errors

- [ ] **Admin Dashboard**
  - [ ] Login page loads
  - [ ] Can log in with admin credentials
  - [ ] Dashboard displays
  - [ ] Can view products, orders, analytics
  - [ ] No console errors

- [ ] **Donations** (If configured)
  - [ ] Donation button works
  - [ ] Donation page loads
  - [ ] Payment flow works (test mode)
  - [ ] Webhook receives events

---

## Final Checklist

- [ ] All three services deployed and running
- [ ] All environment variables set correctly
- [ ] Database seeded with initial data
- [ ] Can log in to admin dashboard
- [ ] Frontend website is functional
- [ ] No critical errors in logs
- [ ] URLs saved for future reference

---

## Your Deployment URLs

**Backend API:**
```
https://____________________.onrender.com
```

**Frontend Website:**
```
https://____________________.onrender.com
```

**Admin Dashboard:**
```
https://____________________.onrender.com
```

**Admin Login:**
- Email: `____________________`
- Password: `____________________`

---

## Quick Commands Reference

### Seed Database (via Render Shell)
```bash
npm run seed
```

### Seed Database (via Local Machine)
```bash
cd backend
npm install
npm run seed
```

### Check Backend Logs
- Render Dashboard → Backend Service → Logs tab

### Manual Redeploy
- Render Dashboard → Service → Manual Deploy → Deploy latest commit

---

**🎉 Deployment Complete!**

If all checkboxes are checked, your platform is live and ready to use!


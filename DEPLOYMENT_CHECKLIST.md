# 🚀 Deployment Checklist

**Project:** Pet E-Commerce Platform  
**Last Updated:** December 2024  
**Status:** Production Ready ✅

---

## 📋 Pre-Deployment Checklist

### 🔒 Security

- [ ] **Environment Variables**
  - [ ] `JWT_SECRET` - Strong, random secret (min 32 characters)
  - [ ] `MONGODB_URI` - Production MongoDB connection string
  - [ ] `NODE_ENV=production` - Set to production
  - [ ] `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
  - [ ] `CLOUDINARY_API_KEY` - Cloudinary API key
  - [ ] `CLOUDINARY_API_SECRET` - Cloudinary API secret
  - [ ] `REDIS_URL` (optional) - Redis connection string for caching
  - [ ] `FRONTEND_URL` - Production frontend URL
  - [ ] `ADMIN_URL` - Production admin URL
  - [ ] `EMAIL_FROM` - Email sender address
  - [ ] `RESEND_API_KEY` (if using Resend) - Email service API key
  - [ ] `STRIPE_SECRET_KEY` (if using Stripe) - Payment gateway secret
  - [ ] `PAYPAL_CLIENT_ID` (if using PayPal) - PayPal client ID
  - [ ] `PAYPAL_CLIENT_SECRET` (if using PayPal) - PayPal client secret

- [ ] **Security Headers**
  - [ ] Helmet.js configured (✅ Already implemented)
  - [ ] CORS configured for production domains only
  - [ ] Rate limiting enabled (✅ Already implemented)
  - [ ] HTTPS enforced in production
  - [ ] Cookie security flags set (httpOnly, secure, sameSite)

- [ ] **Authentication**
  - [ ] JWT tokens use httpOnly cookies (✅ Already implemented)
  - [ ] Password complexity enforced (✅ Already implemented)
  - [ ] Password expiry configured for admin/staff (✅ Already implemented)
  - [ ] RBAC permissions configured (✅ Already implemented)

### 🗄️ Database

- [ ] **MongoDB Setup**
  - [ ] Production MongoDB cluster created
  - [ ] Database user created with appropriate permissions
  - [ ] Connection string configured
  - [ ] Database indexes verified (run `npm run analyze-indexes` in backend)
  - [ ] Backup strategy configured
  - [ ] Connection pooling configured (✅ Already implemented)

- [ ] **Initial Data**
  - [ ] Admin user created (or use `npm run create-admin` script)
  - [ ] Pet types seeded (run `npm run seed-pet-types` if needed)
  - [ ] Email templates seeded (run `npm run seed-email-templates` if needed)

### ☁️ Cloud Services

- [ ] **Cloudinary**
  - [ ] Production Cloudinary account configured
  - [ ] Upload presets configured
  - [ ] CDN enabled
  - [ ] Image optimization settings configured

- [ ] **Redis (Optional)**
  - [ ] Redis instance provisioned
  - [ ] Connection string configured
  - [ ] Cache TTL values reviewed

### 🏗️ Build & Compilation

- [ ] **Backend**
  - [ ] TypeScript compilation successful (`npm run build` in backend)
  - [ ] All dependencies installed (`npm install` in backend)
  - [ ] Environment variables loaded from `.env` file
  - [ ] Server starts without errors

- [ ] **Frontend**
  - [ ] TypeScript compilation successful (`npm run build` in frontend)
  - [ ] Production build created (`npm run build` in frontend)
  - [ ] Environment variables configured (Vite env vars)
  - [ ] API endpoint URLs point to production backend

- [ ] **Admin Dashboard**
  - [ ] TypeScript compilation successful (`npm run build` in admin)
  - [ ] Production build created (`npm run build` in admin)
  - [ ] Environment variables configured
  - [ ] API endpoint URLs point to production backend

### 🌐 Server Configuration

- [ ] **Node.js**
  - [ ] Node.js version 18+ installed
  - [ ] PM2 or similar process manager configured (recommended)
  - [ ] Server restart on crash configured

- [ ] **Reverse Proxy (Nginx/Apache)**
  - [ ] SSL certificate installed (Let's Encrypt recommended)
  - [ ] HTTPS redirect configured
  - [ ] Static file serving configured for frontend/admin
  - [ ] API proxy configured for backend
  - [ ] Gzip compression enabled
  - [ ] Security headers configured

- [ ] **Ports**
  - [ ] Backend API port configured (default: 5000)
  - [ ] Frontend port configured (default: 5173)
  - [ ] Admin port configured (default: 5174)
  - [ ] Firewall rules configured

### 📊 Monitoring & Logging

- [ ] **Error Tracking**
  - [ ] Error tracking service configured (Sentry, LogRocket, etc.)
  - [ ] Error boundaries configured (✅ Already implemented)
  - [ ] Winston logger configured (✅ Already implemented)

- [ ] **Performance Monitoring**
  - [ ] Application performance monitoring (APM) configured
  - [ ] Database query monitoring enabled
  - [ ] Response time tracking enabled

- [ ] **Logs**
  - [ ] Log rotation configured
  - [ ] Log storage location configured
  - [ ] Log retention policy set

### 🧪 Testing

- [ ] **Pre-Deployment Tests**
  - [ ] All TypeScript compilation successful
  - [ ] No linter errors
  - [ ] Critical user flows tested:
    - [ ] User registration
    - [ ] User login
    - [ ] Product browsing
    - [ ] Add to cart
    - [ ] Checkout process
    - [ ] Order placement
    - [ ] Admin login
    - [ ] Product management
    - [ ] Order management

### 📝 Documentation

- [ ] **API Documentation**
  - [ ] Swagger/OpenAPI docs accessible (✅ Available at `/api-docs`)
  - [ ] API endpoints documented

- [ ] **User Documentation**
  - [ ] README.md updated
  - [ ] Deployment guide created (this file)
  - [ ] Environment variables documented

---

## 🚀 Deployment Steps

### 1. Backend Deployment

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Set environment variables (create .env file)
# Copy from .env.example and fill in production values

# Start server (using PM2 recommended)
pm2 start dist/server.js --name pet-shop-backend
# OR
npm start
```

### 2. Frontend Deployment

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in the 'dist' directory
# Serve this directory with Nginx/Apache or deploy to hosting service
```

### 3. Admin Dashboard Deployment

```bash
# Navigate to admin directory
cd admin

# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in the 'dist' directory
# Serve this directory with Nginx/Apache or deploy to hosting service
```

### 4. Nginx Configuration Example

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com;
    
    root /path/to/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Admin Dashboard
server {
    listen 80;
    server_name admin.yourdomain.com;
    
    root /path/to/admin/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## ✅ Post-Deployment Verification

- [ ] **Backend**
  - [ ] API health check: `GET /api/health` returns 200
  - [ ] Swagger docs accessible: `/api-docs`
  - [ ] Database connection successful
  - [ ] Redis connection successful (if configured)

- [ ] **Frontend**
  - [ ] Homepage loads correctly
  - [ ] API calls work (check browser console)
  - [ ] Authentication works
  - [ ] Product pages load
  - [ ] Cart functionality works

- [ ] **Admin Dashboard**
  - [ ] Login page loads
  - [ ] Admin can log in
  - [ ] Dashboard displays correctly
  - [ ] Product management works
  - [ ] Order management works

- [ ] **Security**
  - [ ] HTTPS redirects work
  - [ ] Security headers present (check with securityheaders.com)
  - [ ] Rate limiting works
  - [ ] CORS configured correctly

- [ ] **Performance**
  - [ ] Page load times acceptable (< 3 seconds)
  - [ ] API response times acceptable (< 500ms)
  - [ ] Images load from CDN
  - [ ] Caching working correctly

---

## 🔄 Rollback Plan

If deployment fails:

1. **Backend Rollback**
   ```bash
   pm2 stop pet-shop-backend
   pm2 delete pet-shop-backend
   # Restore previous version
   pm2 start dist/server.js --name pet-shop-backend
   ```

2. **Frontend/Admin Rollback**
   - Restore previous build from backup
   - Update Nginx to point to previous build directory

3. **Database Rollback**
   - Restore from latest backup if needed
   - Use MongoDB Atlas point-in-time recovery if available

---

## 📞 Support & Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB URI
   - Verify network access
   - Check firewall rules

2. **CORS Errors**
   - Verify CORS origins in backend
   - Check frontend/admin URLs match CORS config

3. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check cookie settings (secure, sameSite)
   - Verify domain settings

4. **Image Upload Fails**
   - Check Cloudinary credentials
   - Verify Cloudinary upload limits
   - Check file size limits

### Logs Location

- **Backend:** `backend/logs/` (in production)
- **Frontend/Admin:** Browser console + error tracking service

---

## 🎯 Performance Optimization

- [ ] Enable Gzip compression
- [ ] Configure CDN for static assets
- [ ] Enable Redis caching
- [ ] Optimize database queries
- [ ] Enable image optimization (Cloudinary)
- [ ] Configure browser caching headers

---

## 📈 Monitoring Checklist

- [ ] Set up uptime monitoring
- [ ] Configure error alerts
- [ ] Set up performance alerts
- [ ] Monitor database performance
- [ ] Track API response times
- [ ] Monitor server resources (CPU, memory, disk)

---

**Last Deployment:** _[Date]_  
**Deployed By:** _[Name]_  
**Version:** _[Git Commit Hash]_


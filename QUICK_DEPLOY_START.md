# 🚀 Quick Start: Deploy to New Render Account

## TL;DR - 5 Steps

1. **Set up MongoDB Atlas** → Get connection string
2. **Generate JWT Secret** → 32+ characters
3. **Deploy Backend** → Set environment variables
4. **Deploy Frontend** → Set `VITE_API_URL`
5. **Deploy Admin** → Set `VITE_API_URL`

---

## 📋 What You Need

- [ ] MongoDB Atlas account (free)
- [ ] Render account (free tier available)
- [ ] Stripe account (optional - for donations)

---

## 🔧 Environment Variables Quick Reference

### Backend (Required)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-32-character-secret
CORS_ORIGIN=https://frontend-url.onrender.com,https://admin-url.onrender.com
ADMIN_EMAIL=admin@petshiwu.com
ADMIN_PASSWORD=your-secure-password
```

### Backend (Optional - Stripe)
```env
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Frontend & Admin (Required)
```env
VITE_API_URL=https://your-backend-url.onrender.com/api
```

---

## 📚 Full Guides

- **Detailed Guide**: See `RENDER_DEPLOYMENT_GUIDE.md`
- **Checklist**: See `RENDER_DEPLOYMENT_CHECKLIST.md`

---

## ⚡ Quick Commands

### Generate JWT Secret
```bash
# Mac/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Seed Database (after deployment)
```bash
# In Render Shell or locally
npm run seed
```

---

## 🆘 Common Issues

**Backend won't start?**
- Check MongoDB connection string
- Verify JWT_SECRET is 32+ characters
- Check Render logs

**Frontend blank page?**
- Verify `VITE_API_URL` is set
- Check CORS settings in backend
- Look at browser console

**Build fails?**
- Check Render logs for TypeScript errors
- Verify all dependencies in package.json

---

**Ready?** Start with `RENDER_DEPLOYMENT_GUIDE.md` for step-by-step instructions!


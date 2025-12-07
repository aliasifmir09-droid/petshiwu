# 🎯 GoDaddy Domain Setup Guide

Complete guide to configure your GoDaddy domain with your pet shop application.

---

## 📋 **Prerequisites**

- ✅ GoDaddy domain purchased
- ✅ Backend deployed (e.g., Render, Railway, Heroku)
- ✅ Frontend deployed (e.g., Vercel, Netlify, Render)
- ✅ Admin dashboard deployed

---

## 🌐 **Step 1: Get Your Deployment URLs**

First, get the URLs from your hosting providers:

- **Backend URL:** `https://your-backend.onrender.com` (or your hosting URL)
- **Frontend URL:** `https://your-frontend.vercel.app` (or your hosting URL)
- **Admin URL:** `https://your-admin.vercel.app` (or your hosting URL)

---

## 🔧 **Step 2: Configure DNS in GoDaddy**

### **Option A: Use GoDaddy DNS (Simple)**

1. **Log in to GoDaddy:**
   - Go to [https://www.godaddy.com/](https://www.godaddy.com/)
   - Sign in → My Products → Domains → Manage DNS

2. **Add DNS Records:**

   **For Main Domain (e.g., `petshiwu.com`):**
   ```
   Type: A
   Name: @
   Value: [Your backend server IP] (if you have a static IP)
   TTL: 600 seconds
   ```

   **OR use CNAME (Recommended for most hosting):**
   ```
   Type: CNAME
   Name: @
   Value: [Your hosting provider's CNAME] (e.g., cname.vercel-dns.com)
   TTL: 600 seconds
   ```

   **For Subdomains:**
   ```
   Type: CNAME
   Name: api
   Value: [Your backend URL] (e.g., your-backend.onrender.com)
   TTL: 600 seconds

   Type: CNAME
   Name: admin
   Value: [Your admin URL] (e.g., your-admin.vercel.app)
   TTL: 600 seconds

   Type: CNAME
   Name: www
   Value: [Your frontend URL] (e.g., your-frontend.vercel.app)
   TTL: 600 seconds
   ```

3. **Wait for DNS Propagation:**
   - Can take 24-48 hours (usually 1-2 hours)
   - Check status: [https://dnschecker.org/](https://dnschecker.org/)

---

### **Option B: Use Cloudflare DNS (Recommended - Better Performance)**

Cloudflare provides:
- ✅ Free CDN (faster loading)
- ✅ Free SSL certificates
- ✅ DDoS protection
- ✅ Better DNS management

#### **Setup Cloudflare with GoDaddy Domain:**

1. **Sign up for Cloudflare:**
   - Go to [https://www.cloudflare.com/](https://www.cloudflare.com/)
   - Sign up (free account)

2. **Add Your Domain:**
   - Click "Add a Site"
   - Enter your domain (e.g., `petshiwu.com`)
   - Select "Free" plan
   - Cloudflare will scan your existing DNS records

3. **Update Nameservers in GoDaddy:**
   - Cloudflare will give you 2 nameservers (e.g., `alice.ns.cloudflare.com` and `bob.ns.cloudflare.com`)
   - Go to GoDaddy → Domains → Manage DNS → Nameservers
   - Change from "GoDaddy Nameservers" to "Custom"
   - Enter Cloudflare nameservers
   - Save

4. **Configure DNS in Cloudflare:**
   - Go to Cloudflare Dashboard → DNS → Records
   
   **⚠️ IMPORTANT: Check for Existing Records First!**
   - Look for any existing A, AAAA, or CNAME records with the same name
   - **Delete conflicting records** before adding new ones
   - You cannot have both A and CNAME records with the same name
   - See `CLOUDFLARE_DNS_TROUBLESHOOTING.md` for detailed help
   
   **Then add these records:**

   **Main Domain (Frontend):**
   ```
   Type: CNAME
   Name: @
   Target: [Your frontend hosting CNAME]
   Proxy: ✅ (Orange cloud - enabled)
   TTL: Auto
   ```
   
   **Note:** If you get error "record already exists", delete the old A/AAAA/CNAME record for `@` first!

   **API Subdomain:**
   ```
   Type: CNAME
   Name: api
   Target: [Your backend URL] (e.g., your-backend.onrender.com)
   Proxy: ❌ (Gray cloud - disabled for API)
   TTL: Auto
   ```

   **Admin Subdomain:**
   ```
   Type: CNAME
   Name: admin
   Target: [Your admin URL] (e.g., your-admin.vercel.app)
   Proxy: ✅ (Orange cloud - enabled)
   TTL: Auto
   ```

   **WWW Subdomain:**
   ```
   Type: CNAME
   Name: www
   Target: [Your frontend URL]
   Proxy: ✅ (Orange cloud - enabled)
   TTL: Auto
   ```

5. **Wait for Nameserver Propagation:**
   - Usually takes 1-24 hours
   - Check: [https://dnschecker.org/](https://dnschecker.org/)

---

## 📧 **Step 3: Configure Email with GoDaddy**

### **Option A: Use GoDaddy Email (If You Have GoDaddy Email Plan)**

1. **Get GoDaddy SMTP Settings:**
   ```
   SMTP_HOST=smtpout.secureserver.net
   SMTP_PORT=465 (or 587)
   SMTP_SECURE=true (for 465) or false (for 587)
   SMTP_USER=your-email@yourdomain.com
   SMTP_PASS=your-email-password
   SMTP_FROM=noreply@yourdomain.com
   ```

2. **Add to Backend `.env`:**
   ```env
   SMTP_HOST=smtpout.secureserver.net
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=noreply@yourdomain.com
   SMTP_PASS=your-email-password
   SMTP_FROM=noreply@yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

### **Option B: Use Free Email Service (Recommended)**

**Use Resend (Free - 3,000 emails/month):**

1. **Sign up at Resend:**
   - Go to [https://resend.com/](https://resend.com/)
   - Sign up for free account

2. **Verify Your Domain:**
   - Go to Resend Dashboard → Domains → Add Domain
   - Enter your domain (e.g., `yourdomain.com`)
   - Add DNS records to GoDaddy/Cloudflare:
     ```
     Type: TXT
     Name: @
     Value: [Resend verification string]
     ```
   - Wait for verification (usually instant)

3. **Get API Key:**
   - Go to Resend Dashboard → API Keys
   - Create new API key
   - Copy the key (starts with `re_`)

4. **Update Backend `.env`:**
   ```env
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=resend
   SMTP_PASS=re_your_api_key_here
   SMTP_FROM=noreply@yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

---

## 🔒 **Step 4: SSL/HTTPS Setup**

### **If Using Cloudflare:**
- ✅ SSL is **automatic** and **free**
- Cloudflare provides SSL certificates automatically
- Go to Cloudflare Dashboard → SSL/TLS
- Set mode to "Full" or "Full (strict)"

### **If Using GoDaddy DNS Only:**
- Your hosting provider should provide SSL (Let's Encrypt)
- Render, Vercel, Netlify all provide free SSL automatically
- Just make sure your domain is connected

---

## ⚙️ **Step 5: Update Environment Variables**

### **Backend `.env` Updates:**

```env
# Domain Configuration
FRONTEND_URL=https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com
API_URL=https://api.yourdomain.com

# Email Configuration (Choose one)
# Option 1: GoDaddy Email
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@yourdomain.com

# Option 2: Resend (Recommended)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_FROM=noreply@yourdomain.com

# Redis (Optional - use Upstash free tier)
REDIS_URL=redis://default:password@usw1-xxx.upstash.io:6379

# MongoDB (Your existing connection)
MONGODB_URI=your-mongodb-connection-string
```

### **Frontend Environment Variables:**

```env
VITE_API_URL=https://api.yourdomain.com
VITE_FRONTEND_URL=https://yourdomain.com
```

### **Admin Dashboard Environment Variables:**

```env
VITE_API_URL=https://api.yourdomain.com
VITE_ADMIN_URL=https://admin.yourdomain.com
```

---

## 🚀 **Step 6: Update Your Hosting Configuration**

### **If Using Render:**

1. **Go to Render Dashboard → Your Service → Settings**
2. **Add Custom Domain:**
   - Add `api.yourdomain.com`
   - Render will provide DNS instructions
   - Add CNAME record in GoDaddy/Cloudflare

### **If Using Vercel:**

1. **Go to Vercel Dashboard → Your Project → Settings → Domains**
2. **Add Domain:**
   - Add `yourdomain.com` and `www.yourdomain.com`
   - Vercel will provide DNS instructions
   - Add CNAME records

### **If Using Netlify:**

1. **Go to Netlify Dashboard → Site Settings → Domain Management**
2. **Add Custom Domain:**
   - Add your domain
   - Follow DNS setup instructions

---

## ✅ **Step 7: Verify Everything Works**

### **Checklist:**

1. ✅ **DNS Propagation:**
   - Visit [https://dnschecker.org/](https://dnschecker.org/)
   - Enter your domain
   - Check if DNS records are propagated globally

2. ✅ **Website Access:**
   - Visit `https://yourdomain.com` → Should load frontend
   - Visit `https://www.yourdomain.com` → Should redirect or load frontend
   - Visit `https://api.yourdomain.com` → Should show API info
   - Visit `https://admin.yourdomain.com` → Should load admin dashboard

3. ✅ **SSL Certificate:**
   - Check browser shows 🔒 (secure connection)
   - Visit [https://www.ssllabs.com/ssltest/](https://www.ssllabs.com/ssltest/)
   - Enter your domain to test SSL

4. ✅ **Email Testing:**
   - Register a new user
   - Check if verification email is received
   - Check email sender is `noreply@yourdomain.com`

5. ✅ **API Endpoints:**
   - Test: `https://api.yourdomain.com/api/health`
   - Should return API status

---

## 🔍 **Troubleshooting**

### **Domain Not Loading:**

1. **Check DNS Propagation:**
   - Use [https://dnschecker.org/](https://dnschecker.org/)
   - Wait 24-48 hours if just configured

2. **Check Nameservers:**
   - If using Cloudflare, ensure GoDaddy nameservers are updated
   - If using GoDaddy DNS, ensure nameservers are correct

3. **Check DNS Records:**
   - Verify CNAME/A records are correct
   - Check TTL values (lower = faster updates)

### **SSL Not Working:**

1. **If Using Cloudflare:**
   - Go to SSL/TLS → Set to "Full" or "Full (strict)"
   - Wait 15 minutes for certificate to generate

2. **If Using Hosting Provider SSL:**
   - Ensure domain is properly connected
   - Some providers need 24-48 hours to issue certificate

### **Email Not Sending:**

1. **Check SMTP Settings:**
   - Verify credentials are correct
   - Test with a simple email client first

2. **Check Domain Verification:**
   - If using Resend, ensure domain is verified
   - Check DNS TXT records are correct

3. **Check Firewall:**
   - Ensure SMTP ports (587, 465) are not blocked
   - Some hosting providers block SMTP

---

## 📝 **Example DNS Configuration**

### **For Cloudflare (Recommended):**

```
Type    Name    Target                          Proxy
CNAME   @       your-frontend.vercel.app        ✅
CNAME   www     your-frontend.vercel.app        ✅
CNAME   api     your-backend.onrender.com       ❌
CNAME   admin   your-admin.vercel.app           ✅
TXT     @       v=spf1 include:_spf.resend.com ~all
```

### **For GoDaddy DNS (Simple):**

```
Type    Name    Value                           TTL
CNAME   @       your-frontend.vercel.app        600
CNAME   www     your-frontend.vercel.app        600
CNAME   api     your-backend.onrender.com       600
CNAME   admin   your-admin.vercel.app           600
```

---

## 🎯 **Quick Start Summary**

1. **Choose DNS Provider:**
   - ✅ **Cloudflare** (Recommended - free CDN, SSL, security)
   - OR GoDaddy DNS (Simple, but slower)

2. **Configure DNS:**
   - Add CNAME records for `@`, `www`, `api`, `admin`
   - Point to your hosting URLs

3. **Set Up Email:**
   - ✅ **Resend** (Recommended - 3,000 emails/month free)
   - OR GoDaddy Email (if you have email plan)

4. **Update Environment Variables:**
   - Add domain URLs to `.env` files
   - Configure SMTP settings

5. **Wait & Test:**
   - Wait 1-24 hours for DNS propagation
   - Test all URLs and email

---

## 🔗 **Useful Links**

- **GoDaddy DNS Management:** [https://www.godaddy.com/help/manage-dns-records-680](https://www.godaddy.com/help/manage-dns-records-680)
- **Cloudflare Setup:** [https://developers.cloudflare.com/dns/](https://developers.cloudflare.com/dns/)
- **Resend Domain Setup:** [https://resend.com/docs/dashboard/domains/introduction](https://resend.com/docs/dashboard/domains/introduction)
- **DNS Checker:** [https://dnschecker.org/](https://dnschecker.org/)
- **SSL Checker:** [https://www.ssllabs.com/ssltest/](https://www.ssllabs.com/ssltest/)

---

## 💡 **Pro Tips**

1. **Use Cloudflare** - It's free and provides huge performance boost
2. **Use Resend for Email** - Better delivery than SMTP, free tier is generous
3. **Enable Cloudflare Proxy** - For frontend/admin (orange cloud), disable for API (gray cloud)
4. **Set Low TTL During Setup** - Makes DNS changes propagate faster
5. **Test Everything** - Use DNS checker and SSL checker before going live

---

**Need Help?** Check the troubleshooting section or verify your DNS records match the examples above.


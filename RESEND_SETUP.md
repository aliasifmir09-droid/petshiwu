# 📧 Resend Email Setup Guide

Complete guide for setting up Resend email service for your Pet Shop application.

---

## 🚀 **Quick Setup**

### **Step 1: Sign Up for Resend**

1. Go to [https://resend.com/](https://resend.com/)
2. Sign up for a free account
3. Verify your email address

---

### **Step 2: Get Your API Key**

1. Log in to Resend dashboard
2. Go to **API Keys** section (left sidebar)
3. Click **Create API Key**
4. Give it a name (e.g., "Pet Shop Production")
5. Copy the API key (starts with `re_`)
   - ⚠️ **Important:** Copy it now - you won't see it again!

---

### **Step 3: Add and Verify Your Domain**

1. Go to **Domains** section in Resend dashboard
2. Click **Add Domain**
3. Enter your domain: `petshiwu.com`
4. Click **Add Domain**

5. **Add DNS Records:**
   - Resend will show you DNS records to add
   - Go to your DNS provider (Cloudflare/GoDaddy)
   - Add these records:
     - **SPF Record** (TXT)
     - **DKIM Record** (TXT)
     - **DMARC Record** (TXT) - Optional but recommended

6. **Verify Domain:**
   - Wait a few minutes for DNS propagation
   - Click **Verify** in Resend dashboard
   - Status should change to "Verified" ✅

---

### **Step 4: Configure Backend**

Add these to your `backend/.env` file:

```env
# Resend SMTP Configuration
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_FROM=noreply@petshiwu.com

# Frontend URL
FRONTEND_URL=https://petshiwu.com
```

**Replace:**
- `re_your_api_key_here` → Your actual Resend API key
- `noreply@petshiwu.com` → Your verified domain email
- `https://petshiwu.com` → Your actual frontend URL

---

### **Step 5: Restart Backend Server**

```bash
cd backend
npm run dev
```

---

### **Step 6: Test Email Sending**

1. **Register a new user** on your frontend
2. **Check email inbox** (and spam folder)
3. **Check Resend dashboard** → **Logs** to see email status

---

## 📋 **Complete Configuration**

### **Environment Variables:**

```env
# Required
SMTP_HOST=smtp.resend.com
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here

# Optional (but recommended)
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM=noreply@petshiwu.com
FRONTEND_URL=https://petshiwu.com
```

---

## 🔧 **Configuration Details**

### **SMTP_HOST**
- **Value:** `smtp.resend.com`
- **Required:** ✅ Yes

### **SMTP_PORT**
- **Value:** `587` (STARTTLS) or `465` (SSL)
- **Default:** `587`
- **Recommended:** `587` with `SMTP_SECURE=false`

### **SMTP_SECURE**
- **Value:** `false` (for port 587) or `true` (for port 465)
- **Default:** `false`
- **Recommended:** `false` (with port 587)

### **SMTP_USER**
- **Value:** `resend` (always use this)
- **Required:** ✅ Yes
- **Note:** This is NOT your email address, always use `resend`

### **SMTP_PASS**
- **Value:** Your Resend API key (starts with `re_`)
- **Required:** ✅ Yes
- **Example:** `re_1234567890abcdefghijklmnopqrstuvwxyz`

### **SMTP_FROM**
- **Value:** Email address on your verified domain
- **Required:** ❌ No (but recommended)
- **Example:** `noreply@petshiwu.com`
- **Note:** Must be from a verified domain in Resend

### **FRONTEND_URL**
- **Value:** Your frontend URL
- **Required:** ❌ No
- **Example:** `https://petshiwu.com`

---

## 🔐 **Security Best Practices**

1. **Never commit API keys** to Git
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Use domain-specific API keys**
   - Create separate keys for development/production
   - Revoke keys if compromised

3. **Verify your domain**
   - Improves email deliverability
   - Prevents emails from going to spam

4. **Monitor email logs**
   - Check Resend dashboard regularly
   - Watch for failed deliveries

---

## 📊 **Resend Free Tier Limits**

- ✅ **3,000 emails/month** (free forever)
- ✅ **100 emails/day** limit
- ✅ **Unlimited domains** (after verification)
- ✅ **Email logs** and analytics
- ✅ **API access**

**Upgrade:** If you need more, paid plans start at $20/month for 50,000 emails.

---

## 🧪 **Testing Your Setup**

### **Test 1: Register a New User**

1. Go to registration page
2. Register with a test email
3. Check email inbox
4. Check Resend dashboard → **Logs**

**Expected Result:**
- ✅ Email received in inbox
- ✅ Status shows "Delivered" in Resend dashboard

---

### **Test 2: Request Password Reset**

1. Go to login page
2. Click "Forgot password?"
3. Enter your email
4. Check email inbox

**Expected Result:**
- ✅ Password reset email received
- ✅ Link works correctly

---

### **Test 3: Create an Order**

1. Complete a test order
2. Check email for order confirmation

**Expected Result:**
- ✅ Order confirmation email received

---

## 🚨 **Troubleshooting**

### **Problem: "Authentication failed"**

**Solutions:**
1. Verify `SMTP_USER` is exactly `resend` (not your email)
2. Check API key is correct (starts with `re_`)
3. Ensure API key hasn't been revoked
4. Try creating a new API key

---

### **Problem: "Domain not verified"**

**Solutions:**
1. Go to Resend dashboard → **Domains**
2. Check domain status
3. Verify DNS records are added correctly
4. Wait for DNS propagation (can take up to 48 hours)
5. Click **Verify** again

---

### **Problem: Emails going to spam**

**Solutions:**
1. Verify domain in Resend (adds DKIM/SPF)
2. Use verified domain email in `SMTP_FROM`
3. Avoid spam trigger words in subject/content
4. Warm up your domain (send gradually increasing volume)
5. Check Resend dashboard → **Logs** for delivery issues

---

### **Problem: "Rate limit exceeded"**

**Solutions:**
1. Free tier: 100 emails/day limit
2. Wait 24 hours or upgrade plan
3. Check Resend dashboard → **Usage** for current usage

---

### **Problem: Connection timeout**

**Solutions:**
1. Verify `SMTP_HOST` is `smtp.resend.com`
2. Check firewall allows port 587
3. Try port 465 with `SMTP_SECURE=true`
4. Check Resend status page for outages

---

## 📝 **DNS Records for Resend**

When you add a domain in Resend, you'll need to add these DNS records:

### **SPF Record (TXT)**
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
TTL: Auto
```

### **DKIM Record (TXT)**
```
Type: TXT
Name: resend._domainkey
Value: [Provided by Resend - unique per domain]
TTL: Auto
```

### **DMARC Record (TXT)** - Optional
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@petshiwu.com
TTL: Auto
```

**Where to Add:**
- **Cloudflare:** DNS → Records → Add record
- **GoDaddy:** DNS Management → Add record

---

## ✅ **Verification Checklist**

- [ ] Resend account created
- [ ] API key generated and copied
- [ ] Domain added in Resend dashboard
- [ ] DNS records (SPF, DKIM) added to domain
- [ ] Domain verified in Resend
- [ ] Environment variables added to `backend/.env`
- [ ] Backend server restarted
- [ ] Test email sent successfully
- [ ] Email received in inbox (not spam)

---

## 📚 **Additional Resources**

- **Resend Documentation:** [https://resend.com/docs](https://resend.com/docs)
- **Resend SMTP Guide:** [https://resend.com/docs/send-with-smtp](https://resend.com/docs/send-with-smtp)
- **Email Setup Guide:** `EMAIL_SERVICE_CONFIGURATION.md`
- **Free Services Guide:** `FREE_SERVICES_GUIDE.md`

---

## 🎯 **Quick Reference**

**Your `.env` file should look like:**

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=re_1234567890abcdefghijklmnopqrstuvwxyz
SMTP_FROM=noreply@petshiwu.com
FRONTEND_URL=https://petshiwu.com
```

**That's it!** Your email service is now configured with Resend. 🎉


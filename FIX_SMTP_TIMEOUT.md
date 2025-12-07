# 🔧 Fix SMTP Connection Timeout on Render

## 🚨 **Error: Connection Timeout (ETIMEDOUT)**

This error means Render can't connect to Resend's SMTP server. This is often due to:
1. Port 465 being blocked by Render's firewall
2. Network restrictions on outbound SMTP
3. SSL/TLS handshake issues

---

## ✅ **Solution 1: Use Port 587 with STARTTLS (Recommended)**

**Update your Render Environment Variables:**

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_FROM=noreply@petshiwu.com
FRONTEND_URL=https://petshiwu.com
```

**Changes:**
- `SMTP_PORT=587` (instead of 465)
- `SMTP_SECURE=false` (instead of true)

**Why this works:**
- Port 587 uses STARTTLS (upgrades plain connection to encrypted)
- Less likely to be blocked by firewalls
- More compatible with cloud platforms

---

## ✅ **Solution 2: Use Resend API Directly (If SMTP Fails)**

If SMTP continues to timeout, we can use Resend's API directly instead of SMTP. This requires installing the Resend SDK.

**Would you like me to implement this?** It's more reliable but requires:
1. Installing `resend` package
2. Using Resend API key
3. Slightly different code

---

## 🔍 **Step-by-Step Fix**

### **Step 1: Update Render Environment**

1. Go to **Render Dashboard** → Your Backend Service
2. Click **Environment** tab
3. Find these variables and update:

   **Change:**
   ```
   SMTP_PORT=465  →  SMTP_PORT=587
   SMTP_SECURE=true  →  SMTP_SECURE=false
   ```

4. **Save** environment variables
5. **Redeploy** your service (or it will auto-redeploy)

### **Step 2: Test Again**

After redeploy:
1. Test SMTP: `https://pet-shop-backend-totp.onrender.com/api/test/test-smtp`
2. Try password reset again

### **Step 3: Check Logs**

Look for:
```
Creating SMTP transporter: smtp.resend.com:587, secure: false
✅ SMTP connection verified
```

---

## 🎯 **Quick Fix - Copy This Configuration**

**Replace all your SMTP variables in Render with:**

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_FROM=noreply@petshiwu.com
FRONTEND_URL=https://petshiwu.com
```

**Then:**
1. Save
2. Wait for redeploy (1-2 minutes)
3. Test password reset

---

## 🚨 **If Port 587 Also Times Out**

If port 587 also fails, Render may be blocking all outbound SMTP. In that case:

**Option A: Use Resend API (Recommended)**
- More reliable
- No port blocking issues
- Better error handling
- I can implement this for you

**Option B: Use Different Email Service**
- SendGrid (often works better with cloud platforms)
- Mailgun
- Amazon SES

---

## 📊 **Expected Result After Fix**

**Test Endpoint Response:**
```json
{
  "success": true,
  "message": "SMTP connection successful",
  "config": {
    "host": "smtp.resend.com",
    "port": 587,
    "secure": false,
    "user": "resend"
  }
}
```

**Password Reset:**
- Should work without 500 error
- Email should be sent successfully
- Check Resend dashboard for delivery status

---

**Try port 587 first - it usually fixes the timeout issue!** 🚀


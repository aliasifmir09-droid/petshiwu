# 📧 Email Service Configuration Guide

Complete guide for configuring email services in the Pet Shop application.

---

## 🔧 **Required Environment Variables**

Add these to your `backend/.env` file:

### **Minimum Required (for email to work):**
```env
SMTP_HOST=smtpout.secureserver.net
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
```

### **Complete Configuration:**
```env
# SMTP Server Settings
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password

# Optional Settings
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3000
```

---

## 📋 **Configuration Details**

### **1. SMTP_HOST**
- **Description:** Your SMTP server hostname
- **Required:** ✅ Yes
- **Examples:**
  - GoDaddy: `smtpout.secureserver.net`
  - Office 365: `smtp.office365.com`
  - SendGrid: `smtp.sendgrid.net`
  - Mailgun: `smtp.mailgun.org`

### **2. SMTP_PORT**
- **Description:** SMTP server port
- **Required:** ❌ No (defaults to `587`)
- **Common Values:**
  - `587` - TLS/STARTTLS (recommended)
  - `465` - SSL (use with `SMTP_SECURE=true`)
  - `25` - Usually blocked, not recommended

### **3. SMTP_SECURE**
- **Description:** Use SSL/TLS encryption
- **Required:** ❌ No (defaults to `false`)
- **Values:**
  - `false` - Use TLS/STARTTLS (port 587)
  - `true` - Use SSL (port 465)

### **4. SMTP_USER**
- **Description:** Your email username/login
- **Required:** ✅ Yes
- **Example:** `noreply@yourdomain.com` or `your-email@yourdomain.com`

### **5. SMTP_PASS**
- **Description:** Your email password or API key
- **Required:** ✅ Yes
- **Note:** For some services (SendGrid), this is an API key, not a password

### **6. SMTP_FROM** (Optional)
- **Description:** "From" email address for sent emails
- **Required:** ❌ No
- **Default:** Uses `SMTP_USER` if not set
- **Example:** `noreply@yourdomain.com`

### **7. FRONTEND_URL** (Optional)
- **Description:** Frontend URL for email links
- **Required:** ❌ No
- **Default:** `http://localhost:3000`
- **Example:** `https://yourdomain.com`

---

## 🎯 **Provider-Specific Configurations**

### **GoDaddy Email (Recommended for your setup)**

```env
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@petshiwu.com
SMTP_PASS=your-godaddy-email-password
SMTP_FROM=noreply@petshiwu.com
FRONTEND_URL=https://petshiwu.com
```

**Notes:**
- Use your GoDaddy email account credentials
- Make sure the email account is active in GoDaddy
- Some GoDaddy plans use Office 365 (see below)

---

### **GoDaddy with Office 365**

If your GoDaddy email uses Office 365:

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@petshiwu.com
SMTP_PASS=your-office365-password
SMTP_FROM=noreply@petshiwu.com
FRONTEND_URL=https://petshiwu.com
```

---

### **SendGrid (Free tier available)**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**Setup:**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key in Settings → API Keys
3. Use `apikey` as `SMTP_USER`
4. Use API key as `SMTP_PASS`

---

### **Mailgun (Free tier available)**

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

---

### **Amazon SES**

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**Note:** Replace `us-east-1` with your AWS region.

---

### **Gmail (Not Recommended for Production)**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=your-email@gmail.com
FRONTEND_URL=https://yourdomain.com
```

**Note:** 
- Requires App-Specific Password (not regular password)
- Not recommended for production (rate limits, security concerns)
- Use only for development/testing

---

## 🔍 **How Email Service Works**

### **Current Implementation:**

1. **Email Service Location:** `backend/src/utils/emailService.ts`

2. **Email Functions:**
   - `sendVerificationEmail()` - Email verification
   - `sendPasswordResetEmail()` - Password reset
   - `sendOrderConfirmationEmail()` - Order confirmation
   - `sendOrderCancellationEmail()` - Order cancellation
   - `sendOrderDeliveredEmail()` - Order delivery notification

3. **Configuration Check:**
   - Checks for `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS`
   - If missing, uses test mode (logs links to console)
   - If configured, sends actual emails

4. **Template System:**
   - Uses database templates (manageable via admin dashboard)
   - Falls back to default HTML templates if not found
   - Supports template variables (e.g., `{{firstName}}`, `{{orderNumber}}`)

---

## ✅ **Testing Your Configuration**

### **Step 1: Add Environment Variables**

Add to `backend/.env`:
```env
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@petshiwu.com
SMTP_PASS=your-password
SMTP_FROM=noreply@petshiwu.com
FRONTEND_URL=https://petshiwu.com
```

### **Step 2: Restart Backend Server**

```bash
cd backend
npm run dev
```

### **Step 3: Test Email Sending**

**Option A: Register a New User**
1. Go to frontend registration page
2. Register with a test email
3. Check your email inbox (and spam folder)
4. You should receive a verification email

**Option B: Request Password Reset**
1. Go to login page
2. Click "Forgot password?"
3. Enter your email
4. Check your email inbox

**Option C: Create an Order**
1. Complete a test order
2. Check email for order confirmation

### **Step 4: Check Server Logs**

Look for these messages in your backend console:

**✅ Success:**
```
✅ Verification email sent to user@example.com: <message-id>
✅ Password reset email sent to user@example.com: <message-id>
✅ Order confirmation email sent to user@example.com: <message-id>
```

**⚠️ Warning (No Configuration):**
```
⚠️  No email configuration found. Using test mode (emails won't be sent).
⚠️  To enable email sending, configure SMTP_HOST, SMTP_USER, and SMTP_PASS
📧 Verification link for user@example.com: http://localhost:3000/verify-email?token=...
```

**❌ Error:**
```
❌ Error sending verification email to user@example.com: [error message]
```

---

## 🚨 **Troubleshooting**

### **Problem: "Email not configured" warning**

**Solution:**
- Ensure all three are set: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
- Check for typos in variable names
- Restart backend server after adding variables

---

### **Problem: Connection timeout**

**Possible Causes:**
- Wrong `SMTP_HOST`
- Firewall blocking port 587
- Network issues

**Solutions:**
1. Verify `SMTP_HOST` is correct for your provider
2. Try port 465 with `SMTP_SECURE=true`
3. Check firewall settings
4. Test SMTP connection with email client first

---

### **Problem: Authentication failed**

**Possible Causes:**
- Wrong username/password
- Using account password instead of app password
- Account locked or disabled

**Solutions:**
1. Double-check `SMTP_USER` and `SMTP_PASS`
2. For Gmail, use App-Specific Password
3. Verify email account is active
4. Try logging into email account via webmail first

---

### **Problem: Emails not being received**

**Possible Causes:**
- Emails going to spam
- Invalid `SMTP_FROM` address
- Email service blocking

**Solutions:**
1. Check spam/junk folder
2. Verify `SMTP_FROM` is a valid email address
3. Check server logs for errors
4. Test with a different email address
5. Verify email service account is not suspended

---

### **Problem: GoDaddy-specific issues**

**Solutions:**
1. Make sure GoDaddy email account is active
2. Verify you're using correct SMTP host for your plan
3. Try Office 365 settings if regular GoDaddy doesn't work:
   ```
   SMTP_HOST=smtp.office365.com
   ```
4. Check GoDaddy email settings in account dashboard
5. Ensure email account password is correct

---

## 📊 **Current Configuration Status**

### **Check if Email is Configured:**

The application automatically detects email configuration:

- ✅ **Configured:** If `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are all set
- ⚠️ **Not Configured:** If any of the three are missing (uses test mode)

### **Test Mode Behavior:**

When email is NOT configured:
- ✅ Application still works
- ✅ Verification links logged to console
- ❌ No actual emails sent
- 📝 Useful for development/testing

---

## 🎯 **Recommended Setup for Production**

### **For petshiwu.com:**

```env
# GoDaddy Email Configuration
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@petshiwu.com
SMTP_PASS=your-secure-password
SMTP_FROM=noreply@petshiwu.com

# Frontend URL
FRONTEND_URL=https://petshiwu.com
```

### **Best Practices:**

1. ✅ Use a dedicated email account (e.g., `noreply@petshiwu.com`)
2. ✅ Use strong password for email account
3. ✅ Enable 2FA on email account if possible
4. ✅ Test email delivery before going live
5. ✅ Monitor email logs regularly
6. ✅ Set up email forwarding for support inquiries
7. ✅ Use port 587 with TLS for best compatibility

---

## 📝 **Email Types Sent**

The application sends these emails:

1. **Email Verification** - When user registers
2. **Password Reset** - When user requests password reset
3. **Order Confirmation** - When order is created
4. **Order Cancellation** - When order is cancelled
5. **Order Delivered** - When order status changes to "delivered"
6. **Stock Alerts** - When product comes back in stock (if user subscribed)
7. **Wishlist Sharing** - When user shares wishlist via email

All emails use the same SMTP configuration.

---

## 🔐 **Security Notes**

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Use environment variables** - Don't hardcode credentials
3. **Rotate passwords** - Change email password periodically
4. **Use app-specific passwords** - For services that support it
5. **Monitor email logs** - Watch for suspicious activity

---

## 📚 **Additional Resources**

- **Email Setup Guide:** `backend/EMAIL_SETUP.md`
- **GoDaddy Domain Setup:** `GODADDY_DOMAIN_SETUP.md`
- **Free Services Guide:** `FREE_SERVICES_GUIDE.md`

---

**Need Help?** Check server logs for detailed error messages when email sending fails.


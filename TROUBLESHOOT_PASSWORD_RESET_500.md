# 🔧 Troubleshooting Password Reset 500 Error

Guide to fix the 500 error when sending password reset emails on Render.

---

## 🚨 **Common Causes of 500 Error**

1. **SMTP Connection Failure** - Can't connect to Resend SMTP server
2. **Authentication Failure** - Wrong API key or username
3. **Environment Variables Not Set** - Missing or incorrect env vars
4. **Port Blocking** - Render blocking SMTP ports
5. **Timeout** - SMTP connection timeout

---

## ✅ **Step-by-Step Fix**

### **Step 1: Verify Environment Variables in Render**

Go to your Render dashboard → Your Backend Service → Environment:

**Required Variables:**
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_FROM=noreply@petshiwu.com
FRONTEND_URL=https://petshiwu.com
```

**Check:**
- ✅ All variables are set (no empty values)
- ✅ `SMTP_PASS` is your actual Resend API key (starts with `re_`)
- ✅ `SMTP_USER` is exactly `resend` (not your email)
- ✅ `SMTP_FROM` uses your verified domain email
- ✅ No extra spaces or quotes around values

---

### **Step 2: Check Resend API Key**

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Verify your API key is active
3. Check if key has been revoked
4. Try creating a new API key if needed
5. Update `SMTP_PASS` in Render with new key

---

### **Step 3: Verify Domain in Resend**

1. Go to [Resend Domains](https://resend.com/domains)
2. Check if `petshiwu.com` is verified
3. If not verified:
   - Add domain
   - Add DNS records (SPF, DKIM)
   - Wait for verification
4. Use verified domain email in `SMTP_FROM`

---

### **Step 4: Check Render Logs**

1. Go to Render dashboard → Your Backend Service
2. Click **Logs** tab
3. Look for error messages when password reset is requested
4. Common errors you might see:

**"SMTP connection failed"**
- Check `SMTP_HOST` and `SMTP_PORT`
- Try port 465 with `SMTP_SECURE=true`

**"Authentication failed"**
- Verify `SMTP_USER=resend`
- Check `SMTP_PASS` is correct API key

**"Connection timeout"**
- Render might be blocking SMTP ports
- Try port 465 instead of 587

---

### **Step 5: Try Alternative Port Configuration**

If port 587 doesn't work, try port 465:

**Update in Render Environment:**
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_FROM=noreply@petshiwu.com
```

**Then:**
1. Save environment variables
2. Redeploy backend service
3. Test password reset again

---

### **Step 6: Test SMTP Connection**

Add a test endpoint to verify SMTP connection:

**Create test file:** `backend/src/routes/testEmail.ts`
```typescript
import express from 'express';
import { createTransporter } from '../utils/emailService';
import logger from '../utils/logger';

const router = express.Router();

router.get('/test-smtp', async (req, res) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    res.json({ success: true, message: 'SMTP connection successful' });
  } catch (error: any) {
    logger.error('SMTP test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: {
        code: error.code,
        command: error.command
      }
    });
  }
});

export default router;
```

**Add to server.ts:**
```typescript
import testEmailRouter from './routes/testEmail';
app.use('/api/test', testEmailRouter);
```

**Test:**
- Visit: `https://your-backend.onrender.com/api/test/test-smtp`
- Check response for connection status

---

## 🔍 **Debugging Checklist**

- [ ] Environment variables set in Render dashboard
- [ ] Resend API key is active and correct
- [ ] Domain verified in Resend
- [ ] `SMTP_USER=resend` (exactly, not your email)
- [ ] `SMTP_PASS` is full API key (starts with `re_`)
- [ ] `SMTP_FROM` uses verified domain email
- [ ] Backend service redeployed after env var changes
- [ ] Checked Render logs for specific error
- [ ] Tried alternative port (465 with SSL)

---

## 📋 **Common Error Messages & Fixes**

### **Error: "Invalid login" or "Authentication failed"**

**Fix:**
- Verify `SMTP_USER=resend` (exactly)
- Check API key is correct in `SMTP_PASS`
- Ensure API key hasn't been revoked

---

### **Error: "Connection timeout"**

**Fix:**
- Try port 465 with `SMTP_SECURE=true`
- Check if Render allows SMTP connections
- Verify `SMTP_HOST=smtp.resend.com` is correct

---

### **Error: "Connection refused"**

**Fix:**
- Check `SMTP_HOST` is correct
- Verify port is correct (587 or 465)
- Check firewall/network settings

---

### **Error: "Domain not verified"**

**Fix:**
- Verify domain in Resend dashboard
- Add DNS records (SPF, DKIM)
- Wait for domain verification
- Use verified domain email in `SMTP_FROM`

---

## 🎯 **Quick Fix: Try This Configuration**

**Most Common Working Configuration:**

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_FROM=noreply@petshiwu.com
FRONTEND_URL=https://petshiwu.com
```

**Steps:**
1. Update these in Render environment
2. Save and redeploy
3. Test password reset

---

## 📊 **Check Render Logs for Details**

After requesting password reset, check logs for:

**Good Signs:**
```
✅ SMTP connection verified
✅ Password reset email sent to [email]: [message-id]
```

**Error Signs:**
```
❌ Error sending password reset email: [error message]
❌ SMTP connection verification failed: [error]
```

**Copy the full error message** - it will help identify the exact issue.

---

## 🆘 **Still Not Working?**

1. **Check Resend Status:**
   - Visit [Resend Status Page](https://status.resend.com/)
   - Check for service outages

2. **Verify API Key Permissions:**
   - Go to Resend → API Keys
   - Ensure key has "Send Email" permission

3. **Test with Different Email:**
   - Try with a different recipient email
   - Check if issue is domain-specific

4. **Contact Support:**
   - Check Render support for SMTP restrictions
   - Contact Resend support if API key issues

---

## ✅ **Verification**

Once fixed, you should see in Render logs:
```
✅ SMTP connection verified
✅ Password reset email sent to [email]: [message-id]
```

And in Resend dashboard:
- Email appears in **Logs**
- Status shows "Delivered"

---

**Most common fix:** Using port 465 with `SMTP_SECURE=true` instead of port 587.


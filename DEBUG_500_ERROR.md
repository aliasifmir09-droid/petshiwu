# 🐛 Debugging 500 Error on Password Reset

Quick guide to find and fix the 500 error.

---

## 🔍 **Step 1: Check Render Logs**

1. Go to **Render Dashboard** → Your Backend Service
2. Click **Logs** tab
3. Look for errors when password reset is requested
4. Look for these specific messages:

**What to look for:**
- `❌ Error sending password reset email`
- `SMTP connection failed`
- `Authentication failed`
- `Connection timeout`
- Any stack trace or error details

---

## 🔧 **Step 2: Common Issues & Fixes**

### **Issue 1: Environment Variables Not Set**

**Check in Render:**
- Go to **Environment** tab
- Verify all these are set:
  ```
  SMTP_HOST=smtp.resend.com
  SMTP_PORT=465
  SMTP_SECURE=true
  SMTP_USER=resend
  SMTP_PASS=re_your_api_key_here
  SMTP_FROM=noreply@petshiwu.com
  ```

**Fix:**
- Add missing variables
- Save and redeploy

---

### **Issue 2: Wrong Port/Security Settings**

**Try this configuration:**

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
```

**Or try port 587:**

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
```

---

### **Issue 3: Invalid API Key**

**Check:**
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Verify API key is active
3. Copy full key (starts with `re_`)
4. Update `SMTP_PASS` in Render

---

### **Issue 4: Connection Timeout**

**This is common on Render. Try:**
1. Use port 465 with SSL
2. Add connection timeout settings (already added in code)
3. Check if Render allows SMTP connections

---

## 📋 **Step 3: Test SMTP Configuration**

Add this test endpoint to verify SMTP:

**File:** `backend/src/routes/testEmail.ts`
```typescript
import express from 'express';
import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const router = express.Router();

router.get('/test-smtp', async (req, res) => {
  try {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    logger.info('Testing SMTP configuration:', {
      host,
      port,
      secure,
      user,
      hasPass: !!pass
    });

    if (!host || !user || !pass) {
      return res.status(400).json({
        success: false,
        message: 'SMTP configuration missing',
        config: { host, port, secure, user, hasPass: !!pass }
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: { rejectUnauthorized: false }
    });

    await transporter.verify();
    
    res.json({
      success: true,
      message: 'SMTP connection successful',
      config: { host, port, secure, user }
    });
  } catch (error: any) {
    logger.error('SMTP test failed:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      }
    });
  }
});

export default router;
```

**Add to `backend/src/server.ts`:**
```typescript
import testEmailRouter from './routes/testEmail';
app.use('/api/test', testEmailRouter);
```

**Test:**
- Visit: `https://pet-shop-backend-totp.onrender.com/api/test/test-smtp`
- Check response for detailed error

---

## 🎯 **Quick Fix: Try This**

**Most likely fix - Update Render Environment:**

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_your_full_api_key_here
SMTP_FROM=noreply@petshiwu.com
FRONTEND_URL=https://petshiwu.com
```

**Then:**
1. Save environment variables
2. **Redeploy** backend service
3. Test password reset again
4. Check logs for detailed error

---

## 📊 **What the Logs Should Show**

**After fix, you should see:**
```
Creating SMTP transporter: smtp.resend.com:465, secure: true
✅ SMTP connection verified
✅ Password reset email sent to [email]: [message-id]
```

**If still failing, logs will show:**
```
❌ Error sending password reset email: [detailed error]
```

---

## 🆘 **Still Getting 500?**

1. **Check Render Logs** - Copy the full error message
2. **Test SMTP endpoint** - Use the test endpoint above
3. **Verify Resend API key** - Check it's active in Resend dashboard
4. **Try different port** - Switch between 465 and 587

**Share the error message from Render logs** and I can help debug further!


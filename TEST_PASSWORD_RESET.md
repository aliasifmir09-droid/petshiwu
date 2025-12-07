# 🧪 Testing Password Reset with Resend

Quick guide to test if password reset is working with your Resend email configuration.

---

## ✅ **Current Status**

**Password reset IS integrated with email service:**
- ✅ Uses `sendPasswordResetEmail()` function
- ✅ Uses same SMTP configuration as other emails
- ✅ Works with Resend (or any SMTP provider)
- ✅ Logs reset link in development if email not configured

---

## 🔧 **Configuration Check**

Make sure these are in your `backend/.env`:

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_FROM=noreply@petshiwu.com
FRONTEND_URL=https://petshiwu.com
```

---

## 🧪 **How to Test**

### **Step 1: Start Backend Server**

```bash
cd backend
npm run dev
```

### **Step 2: Request Password Reset**

1. Go to your frontend login page
2. Click "Forgot password?" link
3. Enter a registered email address
4. Click "Send Reset Link"

### **Step 3: Check Results**

**If Email is Configured (Resend):**
- ✅ Check your email inbox
- ✅ You should receive password reset email
- ✅ Check Resend dashboard → **Logs** for delivery status
- ✅ Backend logs should show: `✅ Password reset email sent to [email]: [message-id]`

**If Email is NOT Configured:**
- ⚠️ Backend logs will show: `⚠️ Email not configured. Skipping password reset email`
- 📧 Backend logs will show: `📧 Password reset link for [email]: [url]`
- ❌ No actual email sent (test mode)

---

## 📋 **Expected Backend Logs**

### **Success (Email Configured):**
```
✅ Password reset email sent to user@example.com: <message-id>
```

### **Test Mode (Email Not Configured):**
```
⚠️  Email not configured. Skipping password reset email to user@example.com.
⚠️  In development, you can use the reset link below.
📧 Password reset link for user@example.com: http://localhost:3000/reset-password?token=...
```

### **Error (SMTP Issue):**
```
❌ Error sending password reset email to user@example.com: [error message]
```

---

## 🔍 **Troubleshooting**

### **Problem: No email received**

**Check:**
1. ✅ SMTP settings are correct in `.env`
2. ✅ Backend server restarted after adding env vars
3. ✅ Check spam/junk folder
4. ✅ Check Resend dashboard → **Logs** for delivery status
5. ✅ Verify domain is verified in Resend
6. ✅ Check backend logs for errors

---

### **Problem: "Email not configured" warning**

**Solution:**
- Add `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` to `.env`
- Restart backend server

---

### **Problem: "Authentication failed"**

**Solutions:**
1. Verify `SMTP_USER` is exactly `resend` (not your email)
2. Check API key is correct (starts with `re_`)
3. Ensure API key hasn't been revoked in Resend dashboard

---

### **Problem: Email sent but link doesn't work**

**Check:**
1. ✅ `FRONTEND_URL` is correct in `.env`
2. ✅ Frontend route `/reset-password` exists
3. ✅ Token hasn't expired (1 hour expiration)
4. ✅ Token is correctly passed in URL

---

## ✅ **Verification Checklist**

- [ ] Resend API key added to `.env` as `SMTP_PASS`
- [ ] `SMTP_USER=resend` in `.env`
- [ ] `SMTP_HOST=smtp.resend.com` in `.env`
- [ ] `SMTP_FROM` uses verified domain email
- [ ] Backend server restarted
- [ ] Test password reset request sent
- [ ] Email received in inbox
- [ ] Reset link works correctly
- [ ] Password successfully reset

---

## 🎯 **Quick Test Command**

Test the endpoint directly:

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "If an account with this email exists, a password reset link has been sent."
}
```

---

## 📊 **Resend Dashboard Check**

After sending password reset:

1. Go to [Resend Dashboard](https://resend.com/emails)
2. Check **Logs** section
3. You should see:
   - ✅ Email sent
   - ✅ Status: "Delivered" or "Opened"
   - ✅ Recipient email
   - ✅ Timestamp

---

**If everything is configured correctly, password reset emails will be sent via Resend!** 🎉


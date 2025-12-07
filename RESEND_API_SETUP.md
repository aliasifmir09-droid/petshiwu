# 🚀 Resend API Setup (Recommended for Render)

Since Render blocks SMTP ports, use Resend's REST API instead. This is more reliable and doesn't require SMTP ports.

---

## ✅ **Quick Setup**

### **Step 1: Get Your Resend API Key**

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Click **Create API Key**
3. Give it a name (e.g., "Pet Shop Production")
4. Copy the API key (starts with `re_`)

### **Step 2: Add to Render Environment**

Go to **Render Dashboard** → Your Backend Service → **Environment**:

**Add this variable:**
```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM=noreply@petshiwu.com
```

**You can REMOVE these SMTP variables** (not needed anymore):
- ❌ `SMTP_HOST`
- ❌ `SMTP_PORT`
- ❌ `SMTP_SECURE`
- ❌ `SMTP_USER`
- ❌ `SMTP_PASS`

**Keep these:**
- ✅ `SMTP_FROM` (or use `RESEND_FROM`)
- ✅ `FRONTEND_URL`

### **Step 3: Redeploy**

1. Save environment variables
2. Render will auto-redeploy
3. Wait 1-2 minutes

### **Step 4: Test**

Try password reset again - it should work! 🎉

---

## 📋 **Complete Environment Variables**

**Minimum Required:**
```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM=noreply@petshiwu.com
FRONTEND_URL=https://petshiwu.com
```

**Optional:**
```env
SMTP_FROM=noreply@petshiwu.com  # Used as fallback if RESEND_FROM not set
```

---

## 🎯 **How It Works**

1. **Resend API is tried first** - Uses HTTPS (no port blocking)
2. **Falls back to SMTP** - If API key not set (for backward compatibility)
3. **More reliable** - No connection timeout issues
4. **Better error handling** - Clear error messages

---

## ✅ **Benefits of Resend API**

- ✅ **No port blocking** - Uses HTTPS instead of SMTP ports
- ✅ **More reliable** - Better for cloud platforms like Render
- ✅ **Faster** - Direct API calls
- ✅ **Better error messages** - Clear API responses
- ✅ **Same email quality** - Same Resend service

---

## 🔍 **Verification**

After setup, check Render logs for:
```
✅ Resend API client initialized
Sending password reset email via Resend API to [email]
✅ Password reset email sent via Resend API to [email]: [message-id]
```

---

## 🚨 **Troubleshooting**

### **Problem: "Resend API error"**

**Check:**
1. ✅ `RESEND_API_KEY` is set correctly
2. ✅ API key is active in Resend dashboard
3. ✅ Domain is verified in Resend
4. ✅ `RESEND_FROM` uses verified domain email

### **Problem: Still using SMTP**

**Check logs for:**
- `Resend API failed, falling back to SMTP`
- This means API key might be wrong or missing

**Fix:**
- Verify `RESEND_API_KEY` is set
- Check API key is correct
- Redeploy service

---

## 📊 **Expected Result**

**Test Password Reset:**
- ✅ No 500 error
- ✅ Email sent successfully
- ✅ Check Resend dashboard → Logs for delivery status

**Logs Should Show:**
```
✅ Resend API client initialized
Sending password reset email via Resend API to user@example.com
✅ Password reset email sent via Resend API to user@example.com: abc123
```

---

**This is the recommended solution for Render!** 🚀


# Email Configuration Guide

This guide explains how to configure email sending for the Pet Shop application using SMTP.

## GoDaddy Email Setup (Recommended)

If you have email hosting from GoDaddy, use these settings:

### GoDaddy SMTP Settings

Add these to your `.env` file:

```env
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3000
```

**Note:** 
- Replace `your-email@yourdomain.com` with your actual GoDaddy email address
- Replace `your-email-password` with your email password
- Replace `yourdomain.com` with your actual domain

### Alternative GoDaddy Settings (if above doesn't work)

Some GoDaddy email plans use Office 365. Try these settings:

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3000
```

## Other SMTP Providers

### Custom SMTP Server

If you have your own SMTP server or use another email service:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=noreply@petshiwu.com
FRONTEND_URL=http://localhost:3000
```

**Common SMTP Settings:**

- **Port 587**: Use `SMTP_SECURE=false` (TLS/STARTTLS)
- **Port 465**: Use `SMTP_SECURE=true` (SSL)
- **Port 25**: Usually blocked by ISPs, not recommended

### Popular Email Services

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
SMTP_FROM=noreply@yourdomain.com
```

**Amazon SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

## Development Mode (No Email Configuration)

If you don't configure email settings, the application will:
- Log verification links to the console
- Not actually send emails
- Work for development/testing

**To verify manually in development:**
1. Check server logs for verification links
2. Copy the link and open it in your browser
3. Or use the resend verification endpoint

## Environment Variables

Add these to your `.env` file:

```env
# Required SMTP Settings
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password

# Optional
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3000
```

## Testing Email Configuration

After setting up email, test it by:

1. **Register a new user** - You should receive a verification email
2. **Check server logs** - Look for "✅ Verification email sent"
3. **Check spam folder** - Verification emails might go to spam initially

## Troubleshooting

### "Email not configured" warning
- Ensure all three are set: `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS`
- Check for typos in variable names

### Connection timeout
- Verify `SMTP_HOST` is correct
- Check if port 587 is blocked by firewall
- Try port 465 with `SMTP_SECURE=true`

### Authentication failed
- Double-check `SMTP_USER` and `SMTP_PASS`
- Ensure email password is correct (not account password)
- Some services require app-specific passwords

### Emails not being received
- Check spam/junk folder
- Verify `SMTP_FROM` address is valid
- Check server logs for errors
- Ensure firewall allows SMTP connections

### GoDaddy-specific issues
- Make sure your GoDaddy email account is active
- Verify you're using the correct SMTP host for your plan
- Some GoDaddy plans use Office 365 - try `smtp.office365.com`
- Check GoDaddy email settings in your account dashboard

## Production Recommendations

For production, ensure:
- ✅ Use a professional email service (GoDaddy, SendGrid, Mailgun, etc.)
- ✅ Set `SMTP_FROM` to a valid email address on your domain
- ✅ Use port 587 with TLS (`SMTP_SECURE=false`) for best compatibility
- ✅ Test email delivery before going live
- ✅ Monitor email logs for delivery issues

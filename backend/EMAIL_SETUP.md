# Email Configuration Guide

This guide explains how to configure email sending for the Pet Shop application.

## Quick Setup Options

### Option 1: Gmail (Easiest - Free)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Pet Shop" as the name
   - Copy the 16-character password

3. **Set Environment Variables**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   FRONTEND_URL=http://localhost:3000
   ```

### Option 2: Custom SMTP Server

If you have your own SMTP server or use a service like SendGrid, Mailgun, etc.:

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

- **Gmail**: `smtp.gmail.com`, port `587`, secure `false`
- **Outlook/Hotmail**: `smtp-mail.outlook.com`, port `587`, secure `false`
- **SendGrid**: `smtp.sendgrid.net`, port `587`, secure `false`
- **Mailgun**: `smtp.mailgun.org`, port `587`, secure `false`

### Option 3: Development Mode (No Email Sending)

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
# Email Configuration (choose one method)

# Method 1: Gmail (recommended for development)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Method 2: Custom SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=noreply@petshiwu.com

# Frontend URL (for verification links)
FRONTEND_URL=http://localhost:3000
```

## Testing Email Configuration

After setting up email, test it by:

1. **Register a new user** - You should receive a verification email
2. **Check server logs** - Look for "✅ Verification email sent"
3. **Check spam folder** - Verification emails might go to spam initially

## Troubleshooting

### "Email not configured" warning
- Set `EMAIL_USER` and `EMAIL_PASS` for Gmail, or
- Set `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` for custom SMTP

### Gmail "Less secure app" error
- Use an App Password instead of your regular password
- Enable 2-Factor Authentication first

### Emails not being received
- Check spam/junk folder
- Verify SMTP settings are correct
- Check server logs for errors
- Ensure firewall allows SMTP connections

### Development mode
- In development without email config, check server logs for verification links
- Links are logged when emails can't be sent

## Production Recommendations

For production, use a professional email service:

1. **SendGrid** (Free tier: 100 emails/day)
2. **Mailgun** (Free tier: 5,000 emails/month)
3. **Amazon SES** (Very affordable, pay per email)
4. **Resend** (Developer-friendly, good free tier)

These services provide:
- Better deliverability
- Email analytics
- Bounce handling
- Professional support


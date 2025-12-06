import nodemailer from 'nodemailer';
import logger from './logger';

// Create reusable transporter
const createTransporter = () => {
  // Option 1: Custom SMTP server
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Option 2: Gmail (using App Password)
  // To use Gmail:
  // 1. Enable 2-factor authentication on your Google account
  // 2. Generate an App Password: https://myaccount.google.com/apppasswords
  // 3. Set EMAIL_USER=your-email@gmail.com and EMAIL_PASS=your-app-password
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const isGmail = process.env.EMAIL_USER.includes('@gmail.com');
    return nodemailer.createTransport({
      service: isGmail ? 'gmail' : undefined,
      host: isGmail ? undefined : process.env.SMTP_HOST || 'smtp.gmail.com',
      port: isGmail ? undefined : parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Option 3: Development/Test mode - Use Ethereal Email (creates test account)
  // Emails won't actually be sent, but you can view them at https://ethereal.email
  logger.warn('⚠️  No email configuration found. Using test mode (emails won\'t be sent).');
  logger.warn('⚠️  To enable email sending, configure EMAIL_USER and EMAIL_PASS (for Gmail) or SMTP settings.');
  
  // Return a test transporter that won't actually send emails
  // In development, this prevents errors but emails won't be delivered
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'test@ethereal.email',
      pass: 'test'
    },
    // Don't actually send in test mode
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send email verification
export const sendVerificationEmail = async (email: string, token: string, firstName: string) => {
  try {
    // Check if email is actually configured
    const isEmailConfigured = !!(process.env.SMTP_HOST || process.env.EMAIL_USER);
    
    if (!isEmailConfigured) {
      logger.warn(`⚠️  Email not configured. Skipping verification email to ${email}.`);
      logger.warn(`⚠️  In development, you can verify manually or configure email settings.`);
      // In development/test mode, log the verification link instead
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
      logger.info(`📧 Verification link for ${email}: ${verificationUrl}`);
      return { messageId: 'test-mode', accepted: [email] };
    }

    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@petshiwu.com',
      to: email,
      subject: 'Verify Your Email Address - Petshiwu',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">Welcome to Petshiwu!</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
            <p>Hi ${firstName},</p>
            <p>Thank you for registering with Petshiwu! Please verify your email address to complete your registration.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${verificationUrl}</p>
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
              This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Best regards,<br>
              The Petshiwu Team
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Petshiwu!
        
        Hi ${firstName},
        
        Thank you for registering with Petshiwu! Please verify your email address by clicking the link below:
        
        ${verificationUrl}
        
        This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        
        Best regards,
        The Petshiwu Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Verification email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error: any) {
    logger.error(`❌ Error sending verification email to ${email}:`, error.message);
    // In development, don't fail completely - log the link
    if (process.env.NODE_ENV !== 'production') {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
      logger.warn(`📧 Fallback verification link for ${email}: ${verificationUrl}`);
    }
    throw error;
  }
};

// Send password reset email (for future use)
export const sendPasswordResetEmail = async (email: string, token: string, firstName: string) => {
  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@petshiwu.com',
      to: email,
      subject: 'Reset Your Password - Petshiwu',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">Password Reset Request</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
              This reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Best regards,<br>
              The Petshiwu Team
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hi ${firstName},
        
        We received a request to reset your password. Click the link below to reset it:
        
        ${resetUrl}
        
        This reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        
        Best regards,
        The Petshiwu Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Password reset email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error: any) {
    logger.error(`❌ Error sending password reset email to ${email}:`, error.message);
    // In development, don't fail completely - log the link
    if (process.env.NODE_ENV !== 'production') {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
      logger.warn(`📧 Fallback password reset link for ${email}: ${resetUrl}`);
    }
    throw error;
  }
};


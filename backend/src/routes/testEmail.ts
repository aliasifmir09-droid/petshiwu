import express from 'express';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import logger from '../utils/logger';

const router = express.Router();

// Test email configuration endpoint (Resend API or SMTP)
router.get('/test-smtp', async (req, res) => {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Test Resend API first (recommended)
    if (resendApiKey) {
      try {
        logger.info('Testing Resend API configuration');
        const resend = new Resend(resendApiKey);
        
        // Try to send a test email (or just verify the key is valid)
        // For testing, we'll just verify the client can be created
        res.json({
          success: true,
          method: 'Resend API',
          message: 'Resend API key is configured',
          config: {
            hasApiKey: !!resendApiKey,
            from: process.env.RESEND_FROM || process.env.SMTP_FROM || 'not set'
          }
        });
        return;
      } catch (resendError: any) {
        logger.error('Resend API test failed:', resendError);
        return res.status(500).json({
          success: false,
          method: 'Resend API',
          message: resendError.message,
          error: {
            message: resendError.message
          }
        });
      }
    }

    // Fallback to SMTP test
    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(400).json({
        success: false,
        message: 'Email configuration missing',
        recommendation: 'Add RESEND_API_KEY to use Resend API (recommended for Render)',
        config: {
          hasResendApiKey: !!resendApiKey,
          hasSmtpHost: !!smtpHost,
          hasSmtpUser: !!smtpUser,
          hasSmtpPass: !!smtpPass
        }
      });
    }

    logger.info('Testing SMTP configuration');
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: port,
      secure: secure,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: { rejectUnauthorized: false }
    });

    // Test connection
    await transporter.verify();
    
    res.json({
      success: true,
      method: 'SMTP',
      message: 'SMTP connection successful',
      config: {
        host: smtpHost,
        port: port,
        secure: secure,
        user: smtpUser
      }
    });
  } catch (error: any) {
    logger.error('Email test failed:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    res.status(500).json({
      success: false,
      message: error.message,
      recommendation: error.code === 'ETIMEDOUT' 
        ? 'SMTP ports are blocked. Use RESEND_API_KEY instead (see RESEND_API_SETUP.md)'
        : 'Check your email configuration',
      error: {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        message: error.message
      },
      config: {
        hasResendApiKey: !!process.env.RESEND_API_KEY,
        smtpHost: process.env.SMTP_HOST,
        smtpPort: process.env.SMTP_PORT,
        smtpSecure: process.env.SMTP_SECURE,
        smtpUser: process.env.SMTP_USER,
        hasSmtpPass: !!process.env.SMTP_PASS
      }
    });
  }
});

export default router;


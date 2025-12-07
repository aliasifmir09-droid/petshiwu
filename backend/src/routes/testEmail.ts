import express from 'express';
import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const router = express.Router();

// Test SMTP configuration endpoint
router.get('/test-smtp', async (req, res) => {
  try {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;

    const config = {
      host,
      port,
      secure,
      user,
      hasPass: !!pass,
      hasFrom: !!from
    };

    logger.info('Testing SMTP configuration:', config);

    if (!host || !user || !pass) {
      return res.status(400).json({
        success: false,
        message: 'SMTP configuration missing',
        config,
        missing: {
          host: !host,
          user: !user,
          pass: !pass
        }
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

    // Test connection
    await transporter.verify();
    
    res.json({
      success: true,
      message: 'SMTP connection successful',
      config: {
        host,
        port,
        secure,
        user,
        hasFrom: !!from
      }
    });
  } catch (error: any) {
    logger.error('SMTP test failed:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    res.status(500).json({
      success: false,
      message: error.message,
      error: {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        message: error.message
      },
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER,
        hasPass: !!process.env.SMTP_PASS
      }
    });
  }
});

export default router;


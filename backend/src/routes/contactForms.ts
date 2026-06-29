import express, { Request, Response } from 'express';
import { Resend } from 'resend';
import ContactSubmission from '../models/ContactSubmission';
import logger from '../utils/logger';
import mongoose from 'mongoose';

const router = express.Router();

let resendClient: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'support@petshiwu.com';

// POST /api/v1/contact/investor
router.post('/investor', async (req: Request, res: Response) => {
  try {
    const { name, email, company, investmentRange, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
    }

    // 1) ALWAYS save to MongoDB so submissions are never lost
    let submission: any = null;
    try {
      if (mongoose.connection.readyState === 1) {
        submission = await ContactSubmission.create({
          type: 'investor',
          name,
          email,
          company,
          investmentRange,
          message,
          emailSent: false,
          ipAddress: req.ip || req.headers['x-forwarded-for']?.toString(),
          userAgent: req.headers['user-agent']?.toString()?.slice(0, 500),
        });
        logger.info(`Investor submission saved to DB (id=${submission._id}) from ${email}`);
      } else {
        logger.error('MongoDB not connected — investor submission NOT saved:', { name, email, company });
      }
    } catch (dbErr: any) {
      logger.error('Failed to save investor submission to DB:', dbErr.message);
    }

    // 2) Try to send email via Resend if available
    if (resendClient) {
      try {
        await resendClient.emails.send({
          from: 'PetShiwu Investor Inquiries <noreply@petshiwu.com>',
          to: ADMIN_EMAIL,
          replyTo: email,
          subject: `New Investor Inquiry — ${name}${company ? ` (${company})` : ''}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #1E3A8A, #2563EB); padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">New Investor Inquiry</h1>
                <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 14px;">PetShiwu Investor Relations</p>
              </div>
              <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; font-weight: 600; color: #374151; width: 40%;">Name</td><td style="padding: 8px 0; color: #111827;">${escapeHtml(name)}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Email</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #2563eb;">${escapeHtml(email)}</a></td></tr>
                  ${company ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Company / Fund</td><td style="padding: 8px 0; color: #111827;">${escapeHtml(company)}</td></tr>` : ''}
                  ${investmentRange ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Investment Range</td><td style="padding: 8px 0; color: #111827;">${escapeHtml(investmentRange)}</td></tr>` : ''}
                </table>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                <p style="font-weight: 600; color: #374151; margin-bottom: 8px;">Message</p>
                <p style="color: #111827; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
              </div>
            </div>
          `,
        });
        if (submission) {
          await ContactSubmission.updateOne({ _id: submission._id }, { $set: { emailSent: true } });
        }
        logger.info(`Investor inquiry email sent from ${email}`);
      } catch (emailErr: any) {
        if (submission) {
          await ContactSubmission.updateOne({ _id: submission._id }, { $set: { emailSent: false, emailError: emailErr.message?.slice(0, 500) } });
        }
        logger.error('Investor email send failed (submission saved):', emailErr.message);
      }
    } else {
      logger.warn(`Investor inquiry from ${email} saved to DB but NOT emailed (RESEND_API_KEY not set)`);
    }

    res.json({ success: true, message: 'Your inquiry has been received. We will be in touch shortly.' });
  } catch (error: any) {
    logger.error('Investor form error:', error);
    res.status(500).json({ success: false, message: 'Failed to send inquiry. Please email us directly at support@petshiwu.com' });
  }
});

// POST /api/v1/contact/vendor
router.post('/vendor', async (req: Request, res: Response) => {
  try {
    const { name, email, company, website, productCategory, message } = req.body;

    if (!name || !email || !company || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, company and message are required.' });
    }

    // 1) ALWAYS save to MongoDB
    let submission: any = null;
    try {
      if (mongoose.connection.readyState === 1) {
        submission = await ContactSubmission.create({
          type: 'vendor',
          name,
          email,
          company,
          website,
          productCategory,
          message,
          emailSent: false,
          ipAddress: req.ip || req.headers['x-forwarded-for']?.toString(),
          userAgent: req.headers['user-agent']?.toString()?.slice(0, 500),
        });
        logger.info(`Vendor submission saved to DB (id=${submission._id}) from ${email}`);
      } else {
        logger.error('MongoDB not connected — vendor submission NOT saved:', { name, email, company });
      }
    } catch (dbErr: any) {
      logger.error('Failed to save vendor submission to DB:', dbErr.message);
    }

    // 2) Try Resend
    if (resendClient) {
      try {
        await resendClient.emails.send({
          from: 'PetShiwu Vendor Partnerships <noreply@petshiwu.com>',
          to: ADMIN_EMAIL,
          replyTo: email,
          subject: `New Vendor Application — ${company}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #1E3A8A, #2563EB); padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">New Vendor / Brand Application</h1>
                <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 14px;">PetShiwu Vendor Partnerships</p>
              </div>
              <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; font-weight: 600; color: #374151; width: 40%;">Contact Name</td><td style="padding: 8px 0; color: #111827;">${escapeHtml(name)}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Email</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #2563eb;">${escapeHtml(email)}</a></td></tr>
                  <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Company / Brand</td><td style="padding: 8px 0; color: #111827;">${escapeHtml(company)}</td></tr>
                  ${website ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Website</td><td style="padding: 8px 0;"><a href="${escapeHtml(website)}" style="color: #2563eb;">${escapeHtml(website)}</a></td></tr>` : ''}
                  ${productCategory ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Product Category</td><td style="padding: 8px 0; color: #111827;">${escapeHtml(productCategory)}</td></tr>` : ''}
                </table>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                <p style="font-weight: 600; color: #374151; margin-bottom: 8px;">Message / Product Details</p>
                <p style="color: #111827; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
              </div>
            </div>
          `,
        });
        if (submission) {
          await ContactSubmission.updateOne({ _id: submission._id }, { $set: { emailSent: true } });
        }
        logger.info(`Vendor application email sent from ${email} — ${company}`);
      } catch (emailErr: any) {
        if (submission) {
          await ContactSubmission.updateOne({ _id: submission._id }, { $set: { emailSent: false, emailError: emailErr.message?.slice(0, 500) } });
        }
        logger.error('Vendor email send failed (submission saved):', emailErr.message);
      }
    } else {
      logger.warn(`Vendor application from ${email} saved to DB but NOT emailed (RESEND_API_KEY not set)`);
    }

    res.json({ success: true, message: 'Your application has been received. Our partnerships team will review it and be in touch within 2–3 business days.' });
  } catch (error: any) {
    logger.error('Vendor form error:', error);
    res.status(500).json({ success: false, message: 'Failed to send application. Please email us directly at support@petshiwu.com' });
  }
});

// Admin: GET /api/v1/contact/submissions (auth required) — view all submissions
router.get('/submissions', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const token = authHeader.replace('Bearer ', '');
    const jwt = require('jsonwebtoken');
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback');
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { type, read, limit = '50', skip = '0' } = req.query;
    const filter: any = {};
    if (type && ['investor', 'vendor', 'press', 'general'].includes(type as string)) filter.type = type;
    if (read === 'true') filter.read = true;
    if (read === 'false') filter.read = false;

    const submissions = await ContactSubmission.find(filter)
      .sort({ receivedAt: -1 })
      .skip(parseInt(skip as string) || 0)
      .limit(Math.min(parseInt(limit as string) || 50, 200));

    const total = await ContactSubmission.countDocuments(filter);
    const unread = await ContactSubmission.countDocuments({ ...filter, read: false });

    res.json({ success: true, total, unread, count: submissions.length, submissions });
  } catch (error: any) {
    logger.error('Contact submissions fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
  }
});

// Admin: PATCH /api/v1/contact/submissions/:id/read (auth required)
router.patch('/submissions/:id/read', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const token = authHeader.replace('Bearer ', '');
    const jwt = require('jsonwebtoken');
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback');
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { read, notes } = req.body;
    const update: any = {};
    if (read !== undefined) {
      update.read = !!read;
      if (read) update.readAt = new Date();
    }
    if (notes !== undefined) update.notes = notes;

    const result = await ContactSubmission.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!result) return res.status(404).json({ success: false, message: 'Submission not found' });

    res.json({ success: true, submission: result });
  } catch (error: any) {
    logger.error('Contact submission update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update submission' });
  }
});

function escapeHtml(s: any): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default router;

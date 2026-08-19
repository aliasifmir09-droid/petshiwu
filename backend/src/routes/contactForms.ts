import express, { Request, Response } from 'express';
import ContactSubmission, { ContactSubmissionType } from '../models/ContactSubmission';
import logger from '../utils/logger';
import mongoose from 'mongoose';
import { sendContactFormEmail, ContactMailType } from '../utils/contactMail';

const router = express.Router();

const SUBJECT_LABELS: Record<string, string> = {
  order: 'Order Question',
  product: 'Product Recommendation',
  return: 'Return / Refund',
  shipping: 'Shipping & Delivery',
  account: 'Account Help',
  other: 'Other',
};

async function handleContact(
  type: ContactMailType,
  req: Request,
  res: Response,
  required: string[],
  successMessage: string
) {
  try {
    const body = req.body || {};
    for (const field of required) {
      if (!String(body[field] || '').trim()) {
        return res.status(400).json({
          success: false,
          message: `${required.join(', ')} are required.`,
        });
      }
    }

    const name = String(body.name).trim();
    const email = String(body.email).trim();
    const message = String(body.message).trim();
    const subjectRaw = body.subject ? String(body.subject).trim() : '';
    const subject = SUBJECT_LABELS[subjectRaw] || subjectRaw || undefined;
    const company = body.company ? String(body.company).trim() : undefined;
    const website = body.website ? String(body.website).trim() : undefined;
    const investmentRange = body.investmentRange ? String(body.investmentRange).trim() : undefined;
    const productCategory = body.productCategory ? String(body.productCategory).trim() : undefined;

    let submission: any = null;
    try {
      if (mongoose.connection.readyState === 1) {
        submission = await ContactSubmission.create({
          type: type as ContactSubmissionType,
          name,
          email,
          company,
          website,
          investmentRange,
          productCategory,
          subject,
          message,
          emailSent: false,
          ipAddress: req.ip || req.headers['x-forwarded-for']?.toString(),
          userAgent: req.headers['user-agent']?.toString()?.slice(0, 500),
        });
        logger.info(`${type} submission saved (id=${submission._id}) from ${email}`);
      } else {
        logger.error(`MongoDB not connected — ${type} submission NOT saved:`, { name, email });
      }
    } catch (dbErr: any) {
      logger.error(`Failed to save ${type} submission:`, dbErr.message);
    }

    try {
      const sent = await sendContactFormEmail({
        type,
        name,
        email,
        message,
        subject,
        company,
        website,
        investmentRange,
        productCategory,
      });
      const actuallySent = sent.messageId !== 'dev-not-sent';
      if (submission) {
        await ContactSubmission.updateOne(
          { _id: submission._id },
          { $set: { emailSent: actuallySent, emailError: actuallySent ? undefined : 'No email transport in this environment' } }
        );
      }
      logger.info(`${type} email ${actuallySent ? 'delivered' : 'queued locally'} to ${sent.to} from ${email}`);
    } catch (emailErr: any) {
      if (submission) {
        await ContactSubmission.updateOne(
          { _id: submission._id },
          { $set: { emailSent: false, emailError: emailErr.message?.slice(0, 500) } }
        );
      }
      logger.error(`${type} email send failed:`, emailErr.message);
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
          success: false,
          message: 'Failed to send. Please email us directly at support@petshiwu.com',
        });
      }
    }

    if (!submission && process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        success: false,
        message: 'Failed to send. Please email us directly at support@petshiwu.com',
      });
    }

    res.json({ success: true, message: successMessage });
  } catch (error: any) {
    logger.error(`${type} form error:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to send. Please email us directly at support@petshiwu.com',
    });
  }
}

router.post('/general', (req, res) =>
  handleContact(
    'general',
    req,
    res,
    ['name', 'email', 'message'],
    'Your message has been received. We will get back to you shortly.'
  )
);

router.post('/investor', (req, res) =>
  handleContact(
    'investor',
    req,
    res,
    ['name', 'email', 'message'],
    'Your inquiry has been received. We will be in touch shortly.'
  )
);

router.post('/vendor', (req, res) =>
  handleContact(
    'vendor',
    req,
    res,
    ['name', 'email', 'company', 'message'],
    'Your application has been received. Our partnerships team will review it and be in touch within 2–3 business days.'
  )
);

router.post('/press', (req, res) =>
  handleContact(
    'press',
    req,
    res,
    ['name', 'email', 'message'],
    'Your press inquiry has been received. We will be in touch shortly.'
  )
);

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

export default router;

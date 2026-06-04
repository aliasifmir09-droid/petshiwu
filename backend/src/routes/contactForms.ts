import express, { Request, Response } from 'express';
import { Resend } from 'resend';
import logger from '../utils/logger';

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

    if (resendClient) {
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
                <tr><td style="padding: 8px 0; font-weight: 600; color: #374151; width: 40%;">Name</td><td style="padding: 8px 0; color: #111827;">${name}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td></tr>
                ${company ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Company / Fund</td><td style="padding: 8px 0; color: #111827;">${company}</td></tr>` : ''}
                ${investmentRange ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Investment Range</td><td style="padding: 8px 0; color: #111827;">${investmentRange}</td></tr>` : ''}
              </table>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
              <p style="font-weight: 600; color: #374151; margin-bottom: 8px;">Message</p>
              <p style="color: #111827; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        `,
      });
      logger.info(`Investor inquiry email sent from ${email}`);
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

    if (resendClient) {
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
                <tr><td style="padding: 8px 0; font-weight: 600; color: #374151; width: 40%;">Contact Name</td><td style="padding: 8px 0; color: #111827;">${name}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td></tr>
                <tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Company / Brand</td><td style="padding: 8px 0; color: #111827;">${company}</td></tr>
                ${website ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Website</td><td style="padding: 8px 0;"><a href="${website}" style="color: #2563eb;">${website}</a></td></tr>` : ''}
                ${productCategory ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #374151;">Product Category</td><td style="padding: 8px 0; color: #111827;">${productCategory}</td></tr>` : ''}
              </table>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
              <p style="font-weight: 600; color: #374151; margin-bottom: 8px;">Message / Product Details</p>
              <p style="color: #111827; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        `,
      });
      logger.info(`Vendor application email sent from ${email} — ${company}`);
    }

    res.json({ success: true, message: 'Your application has been received. Our partnerships team will review it and be in touch within 2–3 business days.' });
  } catch (error: any) {
    logger.error('Vendor form error:', error);
    res.status(500).json({ success: false, message: 'Failed to send application. Please email us directly at support@petshiwu.com' });
  }
});

export default router;

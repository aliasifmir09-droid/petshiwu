import express, { Request, Response } from 'express';
import Newsletter from '../models/Newsletter';
import { Resend } from 'resend';
import logger from '../utils/logger';

const router = express.Router();

const DISCOUNT_CODE = 'WELCOME10';
const FROM_EMAIL = 'Petshiwu <hello@petshiwu.com>';
const BASE = 'https://www.petshiwu.com';

// POST /api/v1/newsletter/subscribe
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { email, source = 'homepage' } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const lowerEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email: lowerEmail });
    if (existing && !existing.unsubscribed) {
      return res.status(200).json({
        success: true,
        alreadySubscribed: true,
        message: "You're already subscribed! Check your inbox for the discount code.",
      });
    }

    // Save or reactivate
    if (existing) {
      existing.unsubscribed = false;
      existing.unsubscribedAt = undefined;
      existing.source = source;
      await existing.save();
    } else {
      await Newsletter.create({
        email: lowerEmail,
        source,
        ipAddress: req.ip,
      });
    }

    // Send welcome email with discount code via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: FROM_EMAIL,
          to: lowerEmail,
          subject: `🐾 Your 10% Off Code is Here — Welcome to Petshiwu!`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px">
    <div style="background:linear-gradient(135deg,#1e3a8a,#7c3aed);padding:40px 32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900">Welcome to Petshiwu! 🐾</h1>
      <p style="color:rgba(255,255,255,0.85);margin:12px 0 0;font-size:16px">NYC's Local Pet Supply Store</p>
    </div>
    <div style="padding:40px 32px;text-align:center">
      <p style="color:#333;font-size:17px;line-height:1.6;margin:0 0 24px">
        Thanks for joining our community of NYC pet parents! Here's your exclusive welcome discount:
      </p>
      <div style="background:#f0f4ff;border:2px dashed #7c3aed;border-radius:12px;padding:24px;margin:0 0 32px">
        <p style="color:#555;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Your Discount Code</p>
        <div style="font-size:32px;font-weight:900;color:#1e3a8a;letter-spacing:4px">${DISCOUNT_CODE}</div>
        <p style="color:#555;font-size:14px;margin:8px 0 0">10% off your entire first order</p>
      </div>
      <a href="${BASE}/products" style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#7c3aed);color:#fff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:17px;font-weight:700;margin-bottom:32px">
        Shop Now →
      </a>
      <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px">
      <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap">
        <div style="text-align:center;padding:0 12px">
          <div style="font-size:24px">🚚</div>
          <p style="color:#333;font-size:13px;margin:4px 0 0;font-weight:600">Free delivery over $49</p>
        </div>
        <div style="text-align:center;padding:0 12px">
          <div style="font-size:24px">🏙️</div>
          <p style="color:#333;font-size:13px;margin:4px 0 0;font-weight:600">All 5 NYC boroughs</p>
        </div>
        <div style="text-align:center;padding:0 12px">
          <div style="font-size:24px">📦</div>
          <p style="color:#333;font-size:13px;margin:4px 0 0;font-weight:600">10,000+ products</p>
        </div>
      </div>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center">
      <p style="color:#888;font-size:12px;margin:0">
        © 2026 Petshiwu · Jackson Heights, Queens, NY ·
        <a href="${BASE}" style="color:#7c3aed;text-decoration:none">petshiwu.com</a> ·
        <a href="${BASE}/unsubscribe?email=${encodeURIComponent(lowerEmail)}" style="color:#888">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`,
        });

        await Newsletter.updateOne({ email: lowerEmail }, { discountCodeSent: true });
        logger.info(`[newsletter] Welcome email sent to ${lowerEmail}`);
      } catch (emailErr: any) {
        logger.warn(`[newsletter] Failed to send welcome email to ${lowerEmail}: ${emailErr?.message}`);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Welcome! Your 10% discount code ${DISCOUNT_CODE} has been sent to ${lowerEmail}.`,
      code: DISCOUNT_CODE,
    });
  } catch (err: any) {
    logger.error(`[newsletter] Subscribe error: ${err?.message}`);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// GET /api/v1/newsletter/unsubscribe?email=...
router.get('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.query as { email: string };
    if (!email) return res.status(400).send('Missing email');
    await Newsletter.updateOne(
      { email: email.toLowerCase().trim() },
      { unsubscribed: true, unsubscribedAt: new Date() }
    );
    return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Unsubscribed</h2><p>You've been removed from Petshiwu email updates.</p><a href="https://www.petshiwu.com">Return to Petshiwu</a></body></html>`);
  } catch {
    return res.status(500).send('Error processing unsubscribe.');
  }
});

export default router;

import express, { Response } from 'express';
import User from '../models/User';
import { protect, authorize, AuthRequest } from '../middleware/auth';
// emailService not imported here — we instantiate transports directly below
import logger from '../utils/logger';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/promo/send
// Admin-only: send a promotional email to all verified customers.
// Body: { subject, promoCode, discountText, headline, subtext }
// ─────────────────────────────────────────────────────────────────────────────

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'https://www.petshiwu.com')
    .split(',')[0]
    .trim();

const buildPromoHtml = (firstName: string, opts: {
  headline: string;
  subtext: string;
  promoCode: string;
  discountText: string;
  siteUrl: string;
}) => {
  const { headline, subtext, promoCode, discountText, siteUrl } = opts;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${headline}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}
.wrapper{max-width:600px;margin:0 auto;background:#0d1424;border-radius:20px;overflow:hidden;border:1px solid rgba(99,179,237,0.15)}
.header{position:relative;background:linear-gradient(135deg,#0d1424 0%,#0f1f3d 100%);padding:36px 40px 24px;text-align:center;overflow:hidden}
.header::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#f59e0b,#ef4444,#f59e0b,transparent)}
.grid-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(245,158,11,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,0.03) 1px,transparent 1px);background-size:32px 32px}
.glow{position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:300px;height:200px;background:radial-gradient(ellipse,rgba(245,158,11,0.15) 0%,transparent 70%)}
.logo{font-size:28px;font-weight:900;color:#fbbf24;position:relative;z-index:1}
.header-sub{font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(148,163,184,0.5);margin-top:4px;position:relative;z-index:1}
.paws{margin-top:14px;font-size:16px;opacity:0.3;letter-spacing:10px;position:relative;z-index:1}
.hero{position:relative;background:linear-gradient(160deg,#1a0a00 0%,#1f1500 40%,#0f0a1e 100%);padding:40px 40px 44px;text-align:center;overflow:hidden}
.hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(245,158,11,0.5),transparent)}
.orb-gold{position:absolute;top:-40px;right:-40px;width:220px;height:220px;background:radial-gradient(circle,rgba(245,158,11,0.15) 0%,transparent 70%)}
.orb-purple{position:absolute;bottom:-40px;left:-40px;width:180px;height:180px;background:radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)}
.flash-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);color:#fbbf24;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 14px;border-radius:50px;margin-bottom:18px;position:relative;z-index:1}
.flash-dot{width:6px;height:6px;border-radius:50%;background:#f59e0b;box-shadow:0 0 8px #f59e0b;display:inline-block}
.discount-num{font-size:88px;font-weight:900;line-height:1;color:#fbbf24;position:relative;z-index:1}
.discount-off{font-size:22px;font-weight:800;color:rgba(251,191,36,0.7);display:block;margin-top:-8px;letter-spacing:4px;text-transform:uppercase;position:relative;z-index:1}
.hero-sub{color:rgba(148,163,184,0.75);font-size:14px;line-height:1.7;max-width:380px;margin:14px auto 20px;position:relative;z-index:1}
.code-box{display:inline-block;background:rgba(245,158,11,0.08);border:1.5px dashed rgba(245,158,11,0.4);border-radius:10px;padding:12px 28px;margin-bottom:22px;position:relative;z-index:1}
.code-label{font-size:10px;color:rgba(245,158,11,0.6);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}
.code-val{font-size:24px;font-weight:900;color:#fbbf24;letter-spacing:4px}
.btn{display:inline-block;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#ffffff !important;font-weight:800;font-size:15px;padding:15px 40px;border-radius:50px;text-decoration:none;position:relative;z-index:1}
.greeting{padding:28px 40px 8px}
.greeting h2{font-size:18px;font-weight:700;color:#e2e8f0;margin-bottom:8px}
.greeting p{color:#64748b;font-size:14px;line-height:1.7}
.products{padding:20px 40px 28px}
.prod-label{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(245,158,11,0.4);margin-bottom:14px}
.pill{display:inline-block;background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.18);color:#fbbf24 !important;border-radius:50px;padding:5px 13px;font-size:11px;font-weight:600;text-decoration:none;margin:3px}
.cta-inner{background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(239,68,68,0.08));border:1px solid rgba(245,158,11,0.2);border-radius:16px;padding:28px;text-align:center;margin:0 40px 28px}
.cta-title{font-size:17px;font-weight:800;color:#f1f5f9;margin-bottom:6px}
.cta-desc{color:rgba(148,163,184,0.65);font-size:12px;margin-bottom:18px;line-height:1.6}
.btn-cta{display:inline-block;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#ffffff !important;font-weight:800;font-size:14px;padding:13px 32px;border-radius:50px;text-decoration:none}
.footer{background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.06);padding:22px 40px;text-align:center}
.footer a{color:#475569 !important;font-size:11px;text-decoration:none;margin:0 7px}
.footer-copy{color:#2d3748;font-size:10px;line-height:1.8;margin-top:10px}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="grid-bg"></div>
    <div class="glow"></div>
    <div class="logo">PetShiwu</div>
    <div class="header-sub">Special Offer &middot; Today Only</div>
    <div class="paws">🐾 &nbsp; 🐾 &nbsp; 🐾</div>
  </div>
  <div class="hero">
    <div class="orb-gold"></div>
    <div class="orb-purple"></div>
    <div class="flash-badge"><span class="flash-dot"></span> Flash Sale &mdash; Ends Tonight</div>
    <div class="discount-num">${discountText}</div>
    <div class="discount-off">OFF TODAY</div>
    <div class="hero-sub">${subtext}</div>
    <div class="code-box">
      <div class="code-label">Use code at checkout</div>
      <div class="code-val">${promoCode}</div>
    </div>
    <br>
    <a href="${siteUrl}/products" class="btn">🛍️ &nbsp;Shop Now &amp; Save</a>
  </div>
  <div class="greeting">
    <h2>Hey ${firstName}! 🐾</h2>
    <p>Your pets deserve the best — and today you can get it for less. Use code <strong style="color:#fbbf24">${promoCode}</strong> at checkout and save on your entire order. No minimum, no catches. Today only!</p>
  </div>
  <div class="products" style="padding:20px 40px 24px">
    <div class="prod-label">Shop by pet</div>
    <a href="${siteUrl}/dog" class="pill">🐕 Dogs</a>
    <a href="${siteUrl}/cat" class="pill">🐱 Cats</a>
    <a href="${siteUrl}/bird" class="pill">🐦 Birds</a>
    <a href="${siteUrl}/fish" class="pill">🐟 Fish</a>
    <a href="${siteUrl}/reptile" class="pill">🦎 Reptiles</a>
    <a href="${siteUrl}/small-pet" class="pill">🐹 Small Pets</a>
  </div>
  <div class="cta-inner">
    <div class="cta-title">⚡ Don't let your pets miss out</div>
    <div class="cta-desc">Stock up on food, treats, toys and accessories. Free shipping on orders over $49.</div>
    <a href="${siteUrl}/products" class="btn-cta">Claim My Discount →</a>
  </div>
  <div class="footer">
    <a href="${siteUrl}/shop">Shop</a>
    <a href="${siteUrl}/faq">FAQ</a>
    <a href="${siteUrl}/contact">Contact</a>
    <a href="${siteUrl}/privacy">Privacy</a>
    <a href="${siteUrl}/unsubscribe">Unsubscribe</a>
    <div class="footer-copy">
      © ${new Date().getFullYear()} PetShiwu &middot; Jackson Heights, Queens, NY &middot; support@petshiwu.com<br>
      You're receiving this as a PetShiwu customer.
    </div>
  </div>
</div>
</body>
</html>`;
};

router.post(
  '/send',
  protect,
  authorize('admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      const siteUrl = getFrontendUrl();
      const {
        promoCode = 'PETDAY10',
        discountText = '10%',
        subject = '🐾 10% Off Today Only — PetShiwu Flash Sale!',
        headline = '10% Off Today',
        subtext = 'Order today and save 10% on everything — premium food, toys, accessories & more.',
      } = req.body;

      // Fetch all verified, non-deleted customers
      const users = await User.find({
        emailVerified: true,
        deletedAt: { $exists: false },
        role: { $ne: 'admin' },
      })
        .select('email firstName')
        .lean();

      if (!users.length) {
        return res.status(200).json({ success: true, message: 'No customers found.', sent: 0 });
      }

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const user of users) {
        const firstName = (user as any).firstName || 'Pet Parent';
        const email = (user as any).email;
        if (!email) continue;

        const html = buildPromoHtml(firstName, { headline, subtext, promoCode, discountText, siteUrl });
        const text = `Hey ${firstName}! Use code ${promoCode} at checkout for ${discountText} off your order today. Shop now: ${siteUrl}/products`;

        try {
          // Try Resend first
          const Resend = (await import('resend')).Resend;
          const resendKey = process.env.RESEND_API_KEY;
          if (resendKey) {
            const client = new Resend(resendKey);
            await client.emails.send({
              from: process.env.EMAIL_FROM || 'PetShiwu <noreply@petshiwu.com>',
              to: email,
              subject,
              html,
              text,
            });
          } else {
            // Fallback: nodemailer
            const nodemailer = (await import('nodemailer')).default;
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: parseInt(process.env.SMTP_PORT || '587'),
              secure: process.env.SMTP_SECURE === 'true',
              auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            });
            await transporter.sendMail({
              from: process.env.EMAIL_FROM || '"PetShiwu" <noreply@petshiwu.com>',
              to: email,
              subject,
              html,
              text,
            });
          }
          sent++;
          // Small delay to avoid rate limits
          await new Promise(r => setTimeout(r, 120));
        } catch (err: any) {
          failed++;
          errors.push(`${email}: ${err.message}`);
          logger.warn(`[sendPromo] Failed for ${email}:`, err.message);
        }
      }

      logger.info(`[sendPromo] Done — sent: ${sent}, failed: ${failed}`);
      res.json({ success: true, total: users.length, sent, failed, errors: errors.slice(0, 10) });
    } catch (err: any) {
      logger.error('[sendPromo] Fatal error:', err.message);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

export default router;

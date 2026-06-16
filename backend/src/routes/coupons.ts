import express, { Request, Response } from 'express';
import CouponUsage from '../models/CouponUsage';
import logger from '../utils/logger';

const router = express.Router();

// Hard-coded coupon definitions — extend this as needed
const COUPONS: Record<string, { type: 'percent' | 'fixed'; value: number; description: string }> = {
  'WELCOME10': { type: 'percent', value: 10, description: '10% off your first order' },
  'NYC10':     { type: 'percent', value: 10, description: '10% off for NYC pet parents' },
  'PETDAY10':  { type: 'percent', value: 10, description: '10% off — National Pet Day' },
  'WORLDCUP':  { type: 'percent', value: 10, description: '10% off — World Cup 2026 🇺🇸⚽' },
};

// POST /api/v1/coupons/validate
// Body: { code, subtotal, email }
// Returns: { valid, discountAmount, message, code }
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { code, subtotal = 0, email } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, message: 'Please enter a coupon code.' });
    }

    const normalized = code.trim().toUpperCase();
    const coupon = COUPONS[normalized];

    if (!coupon) {
      return res.status(200).json({ valid: false, message: 'Invalid coupon code. Please check and try again.' });
    }

    // Check if this email has already used this code
    if (email && typeof email === 'string' && email.trim()) {
      const lowerEmail = email.trim().toLowerCase();
      const alreadyUsed = await CouponUsage.findOne({ email: lowerEmail, code: normalized });
      if (alreadyUsed) {
        return res.status(200).json({
          valid: false,
          message: 'This coupon has already been used on your account.',
        });
      }
    }

    const numericSubtotal = Number(subtotal) || 0;
    let discountAmount = 0;
    if (coupon.type === 'percent') {
      const raw = (numericSubtotal * coupon.value) / 100;
      // Cap: 10% off can never save more than $10, 20% off never more than $20, etc.
      const maxDiscount = coupon.value;
      discountAmount = parseFloat(Math.min(raw, maxDiscount).toFixed(2));
    } else {
      discountAmount = Math.min(coupon.value, numericSubtotal);
    }

    logger.info(`[coupons] Code ${normalized} validated for ${email || 'unknown'} — discount: $${discountAmount}`);

    return res.json({
      valid: true,
      code: normalized,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
      description: coupon.description,
      message: `✓ ${coupon.description} — saving $${discountAmount.toFixed(2)}`,
    });

  } catch (err: any) {
    logger.error(`[coupons] Validate error: ${err?.message}`);
    return res.status(500).json({ valid: false, message: 'Something went wrong. Please try again.' });
  }
});

// POST /api/v1/coupons/use
// Called after order is confirmed to lock in the usage
// Body: { code, email, orderId }
router.post('/use', async (req: Request, res: Response) => {
  try {
    const { code, email, orderId } = req.body;

    if (!code || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const normalized = code.trim().toUpperCase();
    const lowerEmail = email.trim().toLowerCase();

    // Upsert — if somehow called twice, just update orderId (no duplicate error)
    await CouponUsage.findOneAndUpdate(
      { email: lowerEmail, code: normalized },
      { email: lowerEmail, code: normalized, orderId: orderId || '', usedAt: new Date() },
      { upsert: true, new: true }
    );

    logger.info(`[coupons] Code ${normalized} marked used for ${lowerEmail}, order: ${orderId}`);
    return res.json({ success: true });

  } catch (err: any) {
    // Duplicate key = already recorded, not a real error
    if (err?.code === 11000) {
      return res.json({ success: true });
    }
    logger.error(`[coupons] Use error: ${err?.message}`);
    return res.status(500).json({ success: false, message: 'Could not record coupon usage.' });
  }
});

export default router;

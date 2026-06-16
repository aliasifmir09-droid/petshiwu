import express, { Request, Response } from 'express';
import Newsletter from '../models/Newsletter';
import logger from '../utils/logger';

const router = express.Router();

// Hard-coded coupon definitions — extend this as needed
const COUPONS: Record<string, { type: 'percent' | 'fixed'; value: number; description: string; requiresNewsletter?: boolean }> = {
  'WELCOME10': { type: 'percent', value: 10, description: '10% off your first order', requiresNewsletter: true },
  'NYC10':     { type: 'percent', value: 10, description: '10% off for NYC pet parents' },
  'PETDAY10':  { type: 'percent', value: 10, description: '10% off — National Pet Day' },
  'WORLDCUP':  { type: 'percent', value: 10, description: '10% off — World Cup 2026 🇺🇸⚽' },
};

// POST /api/v1/coupons/validate
// Body: { code: string, subtotal: number }
// Returns: { valid, discount, discountAmount, message }
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { code, subtotal = 0 } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, message: 'Please enter a coupon code.' });
    }

    const normalized = code.trim().toUpperCase();
    const coupon = COUPONS[normalized];

    if (!coupon) {
      return res.status(200).json({ valid: false, message: 'Invalid coupon code. Please check and try again.' });
    }

    const numericSubtotal = Number(subtotal) || 0;

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'percent') {
      discountAmount = parseFloat(((numericSubtotal * coupon.value) / 100).toFixed(2));
    } else {
      discountAmount = Math.min(coupon.value, numericSubtotal);
    }

    logger.info(`[coupons] Code ${normalized} applied — ${coupon.description}, discount: $${discountAmount}`);

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

export default router;

import express, { Response } from 'express';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { collectRepeatPromoRecipients, sendRepeatCustomerPromo } from '../services/repeatCustomerPromo';
import { REPEAT_PROMO_CODE, buildRepeatCustomerPromoEmail } from '../utils/repeatCustomerPromoEmail';
import logger from '../utils/logger';

const router = express.Router();

const CONFIRM_TOKEN = 'SEND_REPEAT_10';

router.get('/repeat-10', protect, authorize('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const preview = await collectRepeatPromoRecipients();
    const sample = preview.recipients[0]
      ? buildRepeatCustomerPromoEmail(preview.recipients[0])
      : buildRepeatCustomerPromoEmail({ email: 'customer@petshiwu.com', firstName: 'Alex' });
    res.json({
      success: true,
      data: {
        code: REPEAT_PROMO_CODE,
        toSend: preview.recipients.length,
        alreadySent: preview.alreadySent,
        unsubscribed: preview.unsubscribed,
        sampleSubject: sample.subject,
        sampleHtml: sample.html,
      },
    });
  } catch (err: any) {
    logger.error('[repeatPromo] preview failed:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/repeat-10', protect, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const confirm = String(req.body?.confirm || '');
    const dryRun = confirm !== CONFIRM_TOKEN;
    const result = await sendRepeatCustomerPromo({ dryRun, delayMs: dryRun ? 0 : 150 });
    if (dryRun) {
      return res.status(400).json({
        success: false,
        message: `Send was not started. POST { "confirm": "${CONFIRM_TOKEN}" } to email past customers.`,
        data: result,
      });
    }
    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('[repeatPromo] send failed:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/** Back-compat: existing admin POST /api/promo/send now uses the thank-you 10% campaign. */
router.post('/send', protect, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const confirm = String(req.body?.confirm || '');
    const dryRun = confirm !== CONFIRM_TOKEN;
    const result = await sendRepeatCustomerPromo({ dryRun, delayMs: dryRun ? 0 : 150 });
    if (dryRun) {
      return res.status(400).json({
        success: false,
        message: `Send was not started. POST { "confirm": "${CONFIRM_TOKEN}" } to email past customers.`,
        data: result,
      });
    }
    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('[repeatPromo] send failed:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

import Order from '../models/Order';
import Newsletter from '../models/Newsletter';
import PromoCampaignSend from '../models/PromoCampaignSend';
import { sendHtmlEmail } from '../utils/emailService';
import logger from '../utils/logger';
import {
  REPEAT_PROMO_CAMPAIGN_ID,
  REPEAT_PROMO_CODE,
  buildRepeatCustomerPromoEmail,
  siteOrigin,
} from '../utils/repeatCustomerPromoEmail';

export type PromoRecipient = {
  email: string;
  firstName: string;
};

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const normalizeEmail = (value: unknown): string => String(value || '').trim().toLowerCase();

const isValidEmail = (email: string): boolean => EMAIL_RE.test(email);

export async function collectRepeatPromoRecipients(): Promise<{
  recipients: PromoRecipient[];
  alreadySent: number;
  unsubscribed: number;
}> {
  const [unsubRows, sentRows, orders] = await Promise.all([
    Newsletter.find({ unsubscribed: true }).select('email').lean(),
    PromoCampaignSend.find({ campaignId: REPEAT_PROMO_CAMPAIGN_ID, status: 'sent' }).select('email').lean(),
    Order.find({ orderStatus: { $ne: 'cancelled' } })
      .select('guestEmail shippingAddress user')
      .populate('user', 'email firstName role')
      .lean(),
  ]);

  const unsubscribed = new Set(unsubRows.map((row) => normalizeEmail(row.email)).filter(Boolean));
  const alreadySent = new Set(sentRows.map((row) => normalizeEmail(row.email)).filter(Boolean));
  const byEmail = new Map<string, PromoRecipient>();

  for (const order of orders) {
    const user = order.user as { email?: string; firstName?: string; role?: string } | null;
    if (user?.role === 'admin') continue;
    const email = normalizeEmail(order.guestEmail || user?.email);
    if (!isValidEmail(email) || unsubscribed.has(email) || alreadySent.has(email)) continue;
    const firstName =
      String(order.shippingAddress?.firstName || user?.firstName || '').trim() || 'there';
    if (!byEmail.has(email)) {
      byEmail.set(email, { email, firstName });
    }
  }

  return {
    recipients: [...byEmail.values()],
    alreadySent: alreadySent.size,
    unsubscribed: unsubscribed.size,
  };
}

export async function sendRepeatCustomerPromo(options: {
  dryRun?: boolean;
  delayMs?: number;
} = {}): Promise<{
  campaignId: string;
  code: string;
  dryRun: boolean;
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  alreadySent: number;
  unsubscribed: number;
  errors: string[];
}> {
  const dryRun = Boolean(options.dryRun);
  const delayMs = Number.isFinite(options.delayMs) ? Number(options.delayMs) : 150;
  const { recipients, alreadySent, unsubscribed } = await collectRepeatPromoRecipients();
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  if (dryRun) {
    return {
      campaignId: REPEAT_PROMO_CAMPAIGN_ID,
      code: REPEAT_PROMO_CODE,
      dryRun: true,
      total: recipients.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      alreadySent,
      unsubscribed,
      errors: [],
    };
  }

  for (const recipient of recipients) {
    const email = buildRepeatCustomerPromoEmail({ ...recipient, origin: siteOrigin() });
    try {
      const info = await sendHtmlEmail({
        to: recipient.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
      if (!info || info.messageId === 'no-provider' || info.messageId === 'test-mode') {
        throw new Error('Email provider is not configured');
      }
      await PromoCampaignSend.updateOne(
        { campaignId: REPEAT_PROMO_CAMPAIGN_ID, email: recipient.email },
        {
          $set: {
            firstName: recipient.firstName,
            status: 'sent',
            messageId: info.messageId,
            sentAt: new Date(),
            error: undefined,
          },
        },
        { upsert: true }
      );
      sent += 1;
    } catch (err: any) {
      failed += 1;
      const message = err?.message || 'send failed';
      errors.push(`${recipient.email}: ${message}`);
      logger.warn(`[repeatPromo] Failed for ${recipient.email}: ${message}`);
      try {
        await PromoCampaignSend.updateOne(
          { campaignId: REPEAT_PROMO_CAMPAIGN_ID, email: recipient.email },
          {
            $set: {
              firstName: recipient.firstName,
              status: 'failed',
              error: message,
              sentAt: new Date(),
            },
          },
          { upsert: true }
        );
      } catch {
        // ignore duplicate-key races
      }
    }
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  logger.info(`[repeatPromo] Done — sent ${sent}, failed ${failed}, already ${alreadySent}`);
  return {
    campaignId: REPEAT_PROMO_CAMPAIGN_ID,
    code: REPEAT_PROMO_CODE,
    dryRun: false,
    total: recipients.length,
    sent,
    failed,
    skipped: 0,
    alreadySent,
    unsubscribed,
    errors: errors.slice(0, 20),
  };
}

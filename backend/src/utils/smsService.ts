import logger from './logger';

/**
 * Optional SMS via Twilio REST. Configure on Render:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 * When those are missing, texts are skipped and email still goes out.
 */

export const isSmsConfigured = (): boolean =>
  Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
    process.env.TWILIO_FROM_NUMBER?.trim()
  );

/** Normalize US/Canada numbers to E.164. Returns empty string if not usable. */
export const normalizePhoneForSms = (raw: string | undefined | null): string => {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (!trimmed) return '';

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  if (hasPlus) {
    if (digits.length < 10 || digits.length > 15) return '';
    return `+${digits}`;
  }

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return '';
};

export const buildOrderStatusSms = (
  orderNumber: string,
  status: string,
  trackingNumber?: string | null
): string => {
  const number = orderNumber || 'your order';
  switch (status) {
    case 'cancelled':
      return `Petshiwu: Order #${number} has been cancelled. Check your email for details.`;
    case 'processing':
      return `Petshiwu: We're preparing order #${number} now.`;
    case 'shipped':
      return trackingNumber
        ? `Petshiwu: Order #${number} is on the way. Tracking: ${trackingNumber}`
        : `Petshiwu: Order #${number} is on the way.`;
    case 'delivered':
      return `Petshiwu: Order #${number} was delivered. Thank you!`;
    case 'pending':
      return `Petshiwu: Order #${number} is pending. We'll update you when it is being prepared.`;
    default:
      return `Petshiwu: Order #${number} status is now ${status}.`;
  }
};

export type SmsResult = { sent: boolean; skippedReason?: string; messageSid?: string };

export const sendSms = async (to: string, body: string): Promise<SmsResult> => {
  const e164 = normalizePhoneForSms(to);
  if (!e164) {
    return { sent: false, skippedReason: 'invalid_phone' };
  }
  if (!body.trim()) {
    return { sent: false, skippedReason: 'empty_body' };
  }
  if (!isSmsConfigured()) {
    logger.info(`SMS skipped (Twilio not configured) for ${e164}`);
    return { sent: false, skippedReason: 'not_configured' };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const token = process.env.TWILIO_AUTH_TOKEN!.trim();
  const from = process.env.TWILIO_FROM_NUMBER!.trim();
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const params = new URLSearchParams({ To: e164, From: from, Body: body });

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      }
    );
    const payload = await response.json().catch(() => ({})) as { sid?: string; message?: string; error_message?: string };
    if (!response.ok) {
      logger.error(`Twilio SMS failed for ${e164}: ${payload.message || payload.error_message || response.status}`);
      return { sent: false, skippedReason: 'provider_error' };
    }
    logger.info(`SMS sent to ${e164}: ${payload.sid || 'ok'}`);
    return { sent: true, messageSid: payload.sid };
  } catch (error: unknown) {
    logger.error(`Twilio SMS request failed for ${e164}:`, error instanceof Error ? error.message : error);
    return { sent: false, skippedReason: 'network_error' };
  }
};

import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import logger from './logger';

export const SUPPORT_INBOX = 'support@petshiwu.com';

function recipients(): string[] {
  const extra = [process.env.ADMIN_NOTIFY_EMAIL, process.env.ADMIN_EMAIL]
    .map((v) => (v || '').trim().toLowerCase())
    .filter((v) => v && v.includes('@') && v !== SUPPORT_INBOX);
  return [SUPPORT_INBOX, ...Array.from(new Set(extra))];
}

export type ContactMailType = 'investor' | 'vendor' | 'press' | 'general';

export interface ContactMailPayload {
  type: ContactMailType;
  name: string;
  email: string;
  message: string;
  subject?: string;
  company?: string;
  website?: string;
  investmentRange?: string;
  productCategory?: string;
}

const TYPE_LABEL: Record<ContactMailType, string> = {
  investor: 'Investor inquiry',
  vendor: 'Vendor / brand application',
  press: 'Press inquiry',
  general: 'Contact form',
};

export function escapeHtml(s: any): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(payload: ContactMailPayload): string {
  const title = TYPE_LABEL[payload.type];
  const rows: string[] = [
    `<tr><td style="padding:8px 0;font-weight:600;color:#374151;width:40%;">Name</td><td style="padding:8px 0;color:#111827;">${escapeHtml(payload.name)}</td></tr>`,
    `<tr><td style="padding:8px 0;font-weight:600;color:#374151;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(payload.email)}" style="color:#2563eb;">${escapeHtml(payload.email)}</a></td></tr>`,
  ];
  if (payload.subject) {
    rows.push(`<tr><td style="padding:8px 0;font-weight:600;color:#374151;">Subject</td><td style="padding:8px 0;color:#111827;">${escapeHtml(payload.subject)}</td></tr>`);
  }
  if (payload.company) {
    rows.push(`<tr><td style="padding:8px 0;font-weight:600;color:#374151;">Company</td><td style="padding:8px 0;color:#111827;">${escapeHtml(payload.company)}</td></tr>`);
  }
  if (payload.website) {
    rows.push(`<tr><td style="padding:8px 0;font-weight:600;color:#374151;">Website</td><td style="padding:8px 0;"><a href="${escapeHtml(payload.website)}" style="color:#2563eb;">${escapeHtml(payload.website)}</a></td></tr>`);
  }
  if (payload.investmentRange) {
    rows.push(`<tr><td style="padding:8px 0;font-weight:600;color:#374151;">Investment range</td><td style="padding:8px 0;color:#111827;">${escapeHtml(payload.investmentRange)}</td></tr>`);
  }
  if (payload.productCategory) {
    rows.push(`<tr><td style="padding:8px 0;font-weight:600;color:#374151;">Product category</td><td style="padding:8px 0;color:#111827;">${escapeHtml(payload.productCategory)}</td></tr>`);
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#1E3A8A,#2563EB);padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">${escapeHtml(title)}</h1>
        <p style="color:#bfdbfe;margin:4px 0 0;font-size:14px;">Sent to ${escapeHtml(SUPPORT_INBOX)}</p>
      </div>
      <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
        <table style="width:100%;border-collapse:collapse;">${rows.join('')}</table>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
        <p style="font-weight:600;color:#374151;margin-bottom:8px;">Message</p>
        <p style="color:#111827;line-height:1.6;white-space:pre-wrap;">${escapeHtml(payload.message)}</p>
      </div>
    </div>
  `;
}

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Deliver a contact-form message to support@petshiwu.com (or ADMIN_* override).
 * Tries Resend first, then SMTP. In non-production with no transport, logs and returns.
 */
export async function sendContactFormEmail(payload: ContactMailPayload): Promise<{ messageId: string; to: string }> {
  const toList = recipients();
  const to = toList.join(', ');
  const from = process.env.EMAIL_FROM || 'Petshiwu <noreply@petshiwu.com>';
  const subject = `[Petshiwu] ${TYPE_LABEL[payload.type]} — ${payload.name}${payload.company ? ` (${payload.company})` : ''}`;
  const html = buildHtml(payload);
  const mail = {
    from,
    to: toList.length === 1 ? toList[0] : toList,
    replyTo: payload.email,
    subject,
    html,
  };

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send(mail);
    logger.info(`Contact email sent via Resend to ${to} (${payload.type} from ${payload.email})`);
    return { messageId: result.data?.id || 'resend-sent', to };
  }

  if (smtpConfigured()) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: { rejectUnauthorized: false },
    });
    const info = await transporter.sendMail(mail);
    logger.info(`Contact email sent via SMTP to ${to} (${payload.type} from ${payload.email})`);
    return { messageId: info.messageId || 'smtp-sent', to };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Email is not configured (set RESEND_API_KEY or SMTP_HOST)');
  }

  logger.warn(`Contact email NOT sent (no Resend/SMTP). Would go to ${to}: ${subject}`);
  return { messageId: 'dev-not-sent', to };
}

import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import logger from './logger';
import { SUPPORT_INBOX, escapeHtml } from './contactMail';
import { formatCallbackPhone } from './callbackPhone';

export interface CallbackMailPayload {
  phone: string;
  name?: string;
  message?: string;
  pagePath?: string;
}

function recipients(): string[] {
  const extra = [process.env.ADMIN_NOTIFY_EMAIL, process.env.ADMIN_EMAIL]
    .map((v) => (v || '').trim().toLowerCase())
    .filter((v) => v && v.includes('@') && v !== SUPPORT_INBOX);
  return [SUPPORT_INBOX, ...Array.from(new Set(extra))];
}

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function buildCallbackEmail(payload: CallbackMailPayload): { subject: string; html: string } {
  const display = formatCallbackPhone(payload.phone);
  const tel = payload.phone.startsWith('+') ? payload.phone : `+${payload.phone.replace(/\D/g, '')}`;
  const who = payload.name ? escapeHtml(payload.name) : 'A shopper';
  const note = payload.message
    ? `<p style="margin:16px 0 0;color:#1F2937;line-height:1.55;white-space:pre-wrap;">${escapeHtml(payload.message)}</p>`
    : '';
  const page = payload.pagePath
    ? `<p style="margin:12px 0 0;font-size:13px;color:#6B7280;">Page: ${escapeHtml(payload.pagePath)}</p>`
    : '';

  return {
    subject: `CALL NOW · ${display} · they asked for a callback`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Call ${escapeHtml(display)}</title></head>
<body style="margin:0;padding:0;background:#0B1224;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;">
          <tr>
            <td style="background:#12235A;padding:28px 28px 22px;color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#E8C872;font-weight:700;">Call within a minute</div>
              <h1 style="margin:10px 0 0;font-size:28px;line-height:1.15;">${who} left a number</h1>
              <p style="margin:12px 0 0;font-size:22px;font-weight:800;letter-spacing:0.02em;">${escapeHtml(display)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <a href="tel:${escapeHtml(tel)}" style="display:block;background:#E8C872;color:#12235A;padding:18px 20px;text-align:center;text-decoration:none;font-size:18px;font-weight:800;">Call ${escapeHtml(display)}</a>
              ${note}
              ${page}
              <p style="margin:20px 0 0;font-size:14px;color:#4B5563;">They asked in chat for a person to call them now. Stay on this email and tap Call.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

export async function sendCallbackEmail(payload: CallbackMailPayload): Promise<{ messageId: string; to: string }> {
  const toList = recipients();
  const to = toList.join(', ');
  const from = process.env.EMAIL_FROM || 'Petshiwu <noreply@petshiwu.com>';
  const { subject, html } = buildCallbackEmail(payload);
  const mail = {
    from,
    to: toList.length === 1 ? toList[0] : toList,
    subject,
    html,
  };

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send(mail);
    logger.info(`Callback email sent via Resend to ${to} (${payload.phone})`);
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
    logger.info(`Callback email sent via SMTP to ${to} (${payload.phone})`);
    return { messageId: info.messageId || 'smtp-sent', to };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Email is not configured (set RESEND_API_KEY or SMTP_HOST)');
  }

  logger.warn(`Callback email NOT sent (no Resend/SMTP). Would go to ${to}: ${subject}`);
  return { messageId: 'dev-not-sent', to };
}

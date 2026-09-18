import { escapeHtml } from './orderConfirmationEmail';

export const REPEAT_PROMO_CAMPAIGN_ID = 'repeat-10-restock5-2026-09';
export const REPEAT_PROMO_CODE = 'RESTOCK5';
export const REPEAT_PROMO_DISCOUNT = '10% off, max $10';

const SITE = 'https://www.petshiwu.com';
const NAVY = '#1E3A8A';
const GOLD = '#D97706';
const SUPPORT = '+1 (800) 259-2605';

export type RepeatPromoEmailInput = {
  firstName?: string;
  email: string;
  origin?: string;
};

export function siteOrigin(origin?: string): string {
  const raw = origin || process.env.FRONTEND_URL || SITE;
  return String(raw).split(',')[0].trim().replace(/\/+$/, '') || SITE;
}

export function buildRepeatCustomerPromoEmail(
  input: RepeatPromoEmailInput
): { subject: string; html: string; text: string } {
  const origin = siteOrigin(input.origin);
  const firstName = String(input.firstName || '').trim() || 'there';
  const safeName = escapeHtml(firstName);
  const email = String(input.email || '').trim().toLowerCase();
  const shopUrl = `${origin}/products?coupon=${REPEAT_PROMO_CODE}`;
  const unsubscribeUrl = `${origin}/unsubscribe?email=${encodeURIComponent(email)}`;
  const subject = `${firstName === 'there' ? 'A thank-you from Petshiwu' : `${firstName}, a thank-you from Petshiwu`} — 10% off your next order`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Use ${REPEAT_PROMO_CODE} at checkout for 10% off your next order, max $10. No autoship. Packed in Queens for NYC pet parents.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e0d4;">
          <tr>
            <td style="background:${GOLD};height:6px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="background:${NAVY};padding:28px 32px;text-align:center;">
              <img src="${origin}/logo.png" alt="Petshiwu" width="120" style="display:inline-block;max-width:120px;height:auto;" />
              <p style="margin:12px 0 0;color:#FDE68A;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">For NYC pet parents</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 12px;color:#1c1917;">
              <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${GOLD};font-weight:700;">A thank-you for your order</p>
              <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;color:${NAVY};font-weight:700;">Thank you for trusting us with their bowl.</h1>
              <p style="margin:0 0 16px;font-size:17px;line-height:1.65;color:#44403c;">Hi ${safeName},</p>
              <p style="margin:0 0 16px;font-size:17px;line-height:1.65;color:#44403c;">You already ordered from Petshiwu. We packed that order in Jackson Heights for a neighbor who takes pet care seriously — and we would be glad to pack the next one too.</p>
              <p style="margin:0 0 8px;font-size:17px;line-height:1.65;color:#44403c;">Here is <strong>10% off your next order</strong> (maximum $10) on food, litter, and everyday supplies. No subscription. No autoship. Just a thank-you.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px dashed ${GOLD};border-radius:12px;">
                <tr>
                  <td style="padding:22px 20px;text-align:center;">
                    <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#92400e;">Your code at checkout</p>
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:32px;font-weight:800;letter-spacing:0.12em;color:${NAVY};">${REPEAT_PROMO_CODE}</p>
                    <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#57534e;">${REPEAT_PROMO_DISCOUNT} · reusable · no autoship</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 20px;text-align:center;">
              <a href="${shopUrl}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;font-size:16px;padding:14px 28px;border-radius:999px;">Shop and apply ${REPEAT_PROMO_CODE}</a>
              <p style="margin:14px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#78716c;">Same-day in NYC’s 5 boroughs when you order by 3 PM weekdays. Free delivery over $49.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;">
                <tr>
                  <td width="33%" style="padding:14px 8px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#57534e;"><strong style="display:block;color:${NAVY};font-size:13px;margin-bottom:4px;">Dogs</strong>Food, treats, care</td>
                  <td width="33%" style="padding:14px 8px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#57534e;border-left:1px solid #e7e5e4;border-right:1px solid #e7e5e4;"><strong style="display:block;color:${NAVY};font-size:13px;margin-bottom:4px;">Cats</strong>Food, litter, care</td>
                  <td width="33%" style="padding:14px 8px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#57534e;"><strong style="display:block;color:${NAVY};font-size:13px;margin-bottom:4px;">Everyday</strong>Packed in Queens</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="padding:8px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#57534e;">Packed in Queens</td>
                  <td width="33%" style="padding:8px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#57534e;">365-day returns</td>
                  <td width="33%" style="padding:8px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#57534e;">Call ${SUPPORT}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#fafaf9;padding:20px 32px;text-align:center;border-top:1px solid #e7e5e4;">
              <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;color:#78716c;">
                Petshiwu · 37-68 74th Street, Jackson Heights, NY 11372<br />
                <a href="mailto:support@petshiwu.com" style="color:${NAVY};">support@petshiwu.com</a>
                · <a href="tel:+18002592605" style="color:${NAVY};">${SUPPORT}</a>
              </p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#a8a29e;">
                You received this because you placed an order with Petshiwu.
                <a href="${unsubscribeUrl}" style="color:#78716c;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Hi ${firstName},`,
    '',
    'Thank you for your Petshiwu order. Here is 10% off your next one (maximum $10) on food, litter, and everyday supplies. No autoship.',
    '',
    `Code: ${REPEAT_PROMO_CODE}`,
    `Shop: ${shopUrl}`,
    '',
    'Same-day in NYC’s 5 boroughs when you order by 3 PM weekdays. Free delivery over $49.',
    'Packed in Queens. 365-day returns.',
    '',
    `Questions: support@petshiwu.com or ${SUPPORT}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');

  return { subject, html, text };
}

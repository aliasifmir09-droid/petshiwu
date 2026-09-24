import { decodeHtmlEntities, escapeCatalogHtml } from './catalogText';
import { absoluteImageUrl, escapeHtml } from './orderConfirmationEmail';

const SITE_ORIGIN = 'https://www.petshiwu.com';
const BRAND_NAVY = '#1E3A8A';
const BRAND_CREAM = '#F7F4EE';
const BRAND_GOLD = '#E8C872';

export type ReorderReminderItem = {
  name: string;
  quantity: number;
  image?: string;
};

export type ReorderReminderInput = {
  weeks: number;
  items: ReorderReminderItem[];
  buyAgainUrlPath?: string;
  mode?: 'ask' | 'autoship';
};

const originFromEnv = (): string => {
  const raw =
    process.env.FRONTEND_URL ||
    process.env.SITE_URL ||
    process.env.CORS_ORIGIN ||
    SITE_ORIGIN;
  const first = raw.split(',')[0]?.trim();
  return (first || SITE_ORIGIN).replace(/\/+$/, '');
};

const itemRows = (items: ReorderReminderItem[], origin: string): string => {
  const rows = (items || []).slice(0, 8).map((item) => {
    const image = absoluteImageUrl(item.image, origin);
    const thumb = image
      ? `<img src="${escapeHtml(image)}" alt="" width="88" height="88" style="display:block;width:88px;height:88px;object-fit:cover;border:0;background:#ffffff;">`
      : `<div style="width:88px;height:88px;background:#EEF2FF;text-align:center;line-height:88px;color:${BRAND_NAVY};font-size:22px;font-weight:800;font-family:Georgia,serif;">P</div>`;
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #E8E4DA;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="104" valign="top" style="padding-right:16px;">
                <div style="width:88px;height:88px;overflow:hidden;border:1px solid #E8E4DA;background:#ffffff;">${thumb}</div>
              </td>
              <td valign="middle">
                <div style="font-size:16px;line-height:1.4;color:#111827;font-weight:700;">${escapeCatalogHtml(item.name)}</div>
                <div style="margin-top:6px;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#6B7280;font-weight:700;">Qty ${escapeHtml(item.quantity)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  });
  if (!rows.length) return '';
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
      <tr>
        <td style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND_NAVY};font-weight:800;padding-bottom:4px;">Ready to ship</td>
      </tr>
      ${rows.join('')}
    </table>`;
};

const wrapEmail = ({
  origin,
  preheader,
  title,
  kicker,
  orderNumber,
  headline,
  intro,
  itemsHtml,
  notice,
  ctaHref,
  ctaLabel,
  footnote,
}: {
  origin: string;
  preheader: string;
  title: string;
  kicker: string;
  orderNumber: string;
  headline: string;
  intro: string;
  itemsHtml: string;
  notice: string;
  ctaHref: string;
  ctaLabel: string;
  footnote: string;
}): string => {
  const logoUrl = `${origin}/logo.png`;
  const heroUrl = `${origin}/hero-wide-family.jpg`;
  const safeOrder = escapeHtml(orderNumber);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_CREAM};font-family:Georgia,'Times New Roman',Times,serif;color:#111827;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_CREAM};padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #E4DED2;">
          <tr>
            <td style="background:${BRAND_NAVY};padding:28px 32px 22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${origin}" style="text-decoration:none;">
                      <img src="${logoUrl}" alt="Petshiwü" width="196" style="display:block;width:196px;height:auto;border:0;">
                    </a>
                  </td>
                  <td align="right" valign="middle" style="font-family:Arial,Helvetica,sans-serif;">
                    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#BFDBFE;font-weight:700;">${escapeHtml(kicker)}</div>
                    <div style="margin-top:6px;font-size:13px;color:#ffffff;font-weight:700;">Order #${safeOrder}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="height:6px;background:${BRAND_GOLD};font-size:0;line-height:6px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:0;background:#F4F1EA;">
              <img src="${heroUrl}" alt="Dog, cat, and macaw with Petshiwü food" width="640" style="display:block;width:100%;max-width:640px;height:auto;border:0;">
            </td>
          </tr>
          <tr>
            <td style="padding:36px 36px 12px;font-family:Georgia,'Times New Roman',Times,serif;">
              <h1 style="margin:0;font-size:34px;line-height:1.15;letter-spacing:-0.02em;color:${BRAND_NAVY};font-weight:700;">${headline}</h1>
              <p style="margin:16px 0 0;font-size:17px;line-height:1.6;color:#374151;font-family:Arial,Helvetica,sans-serif;">${intro}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 8px;font-family:Arial,Helvetica,sans-serif;">
              ${itemsHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 8px;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;border:1px solid #E4DED2;">
                <tr>
                  <td style="padding:16px 18px;font-size:15px;line-height:1.55;color:#1F2937;">
                    ${notice}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 36px 12px;font-family:Arial,Helvetica,sans-serif;">
              <a href="${ctaHref}" style="display:inline-block;background:${BRAND_NAVY};color:#ffffff;padding:16px 36px;text-decoration:none;font-size:16px;font-weight:800;letter-spacing:0.02em;border-radius:999px;">${escapeHtml(ctaLabel)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6B7280;">
              ${footnote}
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND_NAVY};padding:22px 32px;font-family:Arial,Helvetica,sans-serif;text-align:center;">
              <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#BFDBFE;font-weight:700;">No silent charge · PayPal or card · 365-day returns</div>
              <div style="margin-top:10px;font-size:14px;color:#ffffff;font-weight:700;">
                <a href="tel:+18002592605" style="color:#ffffff;text-decoration:none;">+1 (800) 259-2605</a>
                <span style="color:#93C5FD;"> · 24/7</span>
              </div>
              <div style="margin-top:8px;font-size:13px;">
                <a href="${origin}" style="color:#DBEAFE;text-decoration:none;">www.petshiwu.com</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const buildReorderReminderEmail = (
  firstName: string,
  orderNumber: string,
  reminder: ReorderReminderInput
): { subject: string; html: string } => {
  const origin = originFromEnv();
  const mode = reminder.mode === 'autoship' ? 'autoship' : 'ask';
  const buyAgainUrl = `${origin}${
    reminder.buyAgainUrlPath ||
    (mode === 'ask' ? '/restock?coupon=RESTOCK5' : '/restock?coupon=RESTOCK7&mode=autoship')
  }`;
  const safeName = escapeCatalogHtml(firstName || 'there');
  const itemsHtml = itemRows(reminder.items || [], origin);

  if (mode === 'autoship') {
    return {
      subject: `Your Petshiwu autoship is due — 7% off or skip #${orderNumber}`,
      html: wrapEmail({
        origin,
        preheader: `Your usual is on schedule. Ship now for 7% off (max $10). We will not charge unless you pay.`,
        title: 'Your autoship is due',
        kicker: 'Scheduled restock',
        orderNumber,
        headline: 'Autoship is due',
        intro: `Hi ${safeName}, your usual is on schedule. Tap <strong>Ship now</strong> to pay and we'll pack it. Autoship is the better price: <strong>7% off (max $10)</strong>.`,
        itemsHtml,
        notice:
          '<strong>We will not charge your card unless you tap Ship now and pay.</strong> Ignore this email and we skip this cycle.',
        ctaHref: buyAgainUrl,
        ctaLabel: 'Ship now — 7% off (max $10)',
        footnote:
          'Not a silent charge. Ask first is 10% off, max $10, if you\'d rather confirm each time. Add or remove items in your restock cart on the dashboard.',
      }),
    };
  }

  return {
    subject: `Confirm now for 10% off (max $10) — restock #${orderNumber}`,
    html: wrapEmail({
      origin,
      preheader: `Confirm now for 10% off (max $10). No subscription. We will not charge unless you pay.`,
      title: 'Confirm now — 10% off your restock',
      kicker: 'Restock reminder',
      orderNumber,
      headline: 'Confirm now. Get 10% off.',
      intro: `Hi ${safeName}, your usual is ready. Confirm now and we take <strong>10% off (max $10)</strong> at checkout. No subscription. No autoship required.`,
      itemsHtml,
      notice:
        '<strong>We will not charge your card unless you tap Confirm now and pay.</strong> Ignore this email and nothing ships.',
      ctaHref: buyAgainUrl,
      ctaLabel: 'Confirm now — 10% off (max $10)',
      footnote:
        'Add or remove items in your restock cart any time. Toys skip restock — add what they actually run out of.',
    }),
  };
};

import { escapeCatalogHtml } from './catalogText';
import { absoluteImageUrl, escapeHtml } from './orderConfirmationEmail';

const SITE_ORIGIN = 'https://www.petshiwu.com';
const BRAND_NAVY = '#1E3A8A';
const BRAND_NAVY_DEEP = '#12235A';
const BRAND_INK = '#0B1224';
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
      ? `<img src="${escapeHtml(image)}" alt="" width="148" height="148" style="display:block;width:148px;height:148px;object-fit:cover;border:0;background:#ffffff;">`
      : `<div style="width:148px;height:148px;background:${BRAND_NAVY_DEEP};text-align:center;line-height:148px;color:${BRAND_GOLD};font-size:36px;font-weight:700;font-family:Georgia,serif;">P</div>`;
    return `
      <tr>
        <td style="padding:0 0 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E4DED2;">
            <tr>
              <td width="8" style="background:${BRAND_GOLD};font-size:0;line-height:0;">&nbsp;</td>
              <td width="164" valign="middle" style="padding:16px 12px 16px 16px;background:${BRAND_CREAM};">
                <div style="width:148px;height:148px;overflow:hidden;background:#ffffff;">${thumb}</div>
              </td>
              <td valign="middle" style="padding:22px 24px 22px 8px;background:#ffffff;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B45309;font-weight:700;">Your usual</div>
                <div style="margin-top:8px;font-family:Georgia,'Times New Roman',Times,serif;font-size:20px;line-height:1.3;color:#111827;font-weight:700;">${escapeCatalogHtml(item.name)}</div>
                <div style="margin-top:14px;font-family:Arial,Helvetica,sans-serif;display:inline-block;border:1px solid ${BRAND_NAVY};color:${BRAND_NAVY};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:800;padding:6px 10px;">Qty ${escapeHtml(item.quantity)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  });
  if (!rows.length) return '';
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;">
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND_NAVY};font-weight:800;padding:0 0 14px;">Ready to ship</td>
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
  offerPercent,
  offerCode,
  offerLine,
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
  offerPercent: string;
  offerCode: string;
  offerLine: string;
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
<body style="margin:0;padding:0;background:${BRAND_INK};font-family:Georgia,'Times New Roman',Times,serif;color:#111827;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_INK};padding:36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;">
          <tr>
            <td style="background:${BRAND_NAVY_DEEP};padding:36px 36px 28px;text-align:center;">
              <a href="${origin}" style="text-decoration:none;">
                <img src="${logoUrl}" alt="Petshiwü" width="220" style="display:inline-block;width:220px;height:auto;border:0;">
              </a>
              <div style="margin:18px auto 0;width:56px;height:2px;background:${BRAND_GOLD};font-size:0;line-height:2px;">&nbsp;</div>
              <div style="margin-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${BRAND_GOLD};font-weight:700;">NYC same-day · 24/7</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0;background:#0F1F4D;line-height:0;font-size:0;">
              <img src="${heroUrl}" alt="Dog, cat, and macaw with Petshiwü food" width="640" style="display:block;width:100%;max-width:640px;height:auto;border:0;">
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND_NAVY};padding:40px 40px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND_GOLD};font-weight:700;">${escapeHtml(kicker)}</td>
                  <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#BFDBFE;font-weight:700;">Order #${safeOrder}</td>
                </tr>
              </table>
              <h1 style="margin:16px 0 0;font-size:44px;line-height:1.05;letter-spacing:-0.03em;color:#ffffff;font-weight:700;">${headline}</h1>
              <p style="margin:18px 0 0;font-size:18px;line-height:1.6;color:#DBEAFE;font-family:Arial,Helvetica,sans-serif;">${intro}</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px;background:${BRAND_GOLD};font-size:0;line-height:4px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 36px 8px;background:${BRAND_CREAM};font-family:Arial,Helvetica,sans-serif;">
              ${itemsHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 8px;background:${BRAND_CREAM};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_NAVY_DEEP};">
                <tr>
                  <td width="150" align="center" valign="middle" style="padding:26px 10px;border-right:1px solid ${BRAND_GOLD};">
                    <div style="font-family:Georgia,'Times New Roman',Times,serif;font-size:52px;line-height:0.9;color:${BRAND_GOLD};font-weight:700;">${escapeHtml(offerPercent)}</div>
                    <div style="margin-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#BFDBFE;font-weight:700;">off · max $10</div>
                  </td>
                  <td valign="middle" style="padding:26px 28px;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND_GOLD};font-weight:700;">Your code</div>
                    <div style="margin-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:30px;line-height:1;letter-spacing:0.1em;color:#ffffff;font-weight:800;">${escapeHtml(offerCode)}</div>
                    <div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.45;color:#DBEAFE;">${escapeHtml(offerLine)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 8px;background:${BRAND_CREAM};font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E4DED2;">
                <tr>
                  <td style="padding:18px 20px;font-size:15px;line-height:1.55;color:#1F2937;">
                    ${notice}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px 10px;background:${BRAND_CREAM};font-family:Arial,Helvetica,sans-serif;">
              <a href="${ctaHref}" style="display:block;background:${BRAND_GOLD};color:${BRAND_NAVY_DEEP};padding:18px 24px;text-decoration:none;font-size:17px;font-weight:800;letter-spacing:0.04em;text-align:center;">${escapeHtml(ctaLabel)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 32px;background:${BRAND_CREAM};font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6B7280;">
              ${footnote}
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND_NAVY_DEEP};padding:28px 32px 24px;font-family:Arial,Helvetica,sans-serif;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 8px 12px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND_GOLD};font-weight:700;">No silent charge</td>
                  <td align="center" style="padding:0 8px 12px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND_GOLD};font-weight:700;">PayPal or card</td>
                  <td align="center" style="padding:0 8px 12px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND_GOLD};font-weight:700;">365-day returns</td>
                </tr>
              </table>
              <div style="font-size:16px;color:#ffffff;font-weight:700;">
                <a href="tel:+18002592605" style="color:#ffffff;text-decoration:none;">+1 (800) 259-2605</a>
                <span style="color:${BRAND_GOLD};"> · 24/7</span>
              </div>
              <div style="margin-top:10px;font-size:13px;">
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
        offerPercent: '7%',
        offerCode: 'RESTOCK7',
        offerLine: 'Already waiting in your restock cart.',
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
      offerPercent: '10%',
      offerCode: 'RESTOCK5',
      offerLine: 'Already waiting in your restock cart.',
    }),
  };
};

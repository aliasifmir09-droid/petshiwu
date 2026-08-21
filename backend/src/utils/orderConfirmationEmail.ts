const SITE_ORIGIN = 'https://www.petshiwu.com';
const BRAND_NAVY = '#1E3A8A';
const ORDERS_OPEN_AT = new Date('2026-08-28T00:00:00-04:00');
const ORDERS_OPEN_LABEL = 'August 28, 2026';

export type OrderConfirmationItem = {
  name: string;
  quantity: number;
  price: number;
  image?: string;
};

export type OrderConfirmationAddress = {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
};

export type OrderConfirmationData = {
  orderId?: string;
  items: OrderConfirmationItem[];
  totalPrice: number;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  donationAmount?: number;
  shippingAddress: OrderConfirmationAddress;
  paymentMethod: string;
  orderStatus?: string;
  createdAt: Date | string;
};

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatUsd(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `$${value.toFixed(2)}`;
}

export function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cod: 'Cash on delivery',
    paypal: 'PayPal',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    credit_card: 'Card',
  };
  return labels[method] || String(method || 'Payment').replace(/_/g, ' ');
}

export function absoluteImageUrl(url?: string, origin = SITE_ORIGIN): string | undefined {
  const value = String(url || '').trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
}

export function formatOrderDate(createdAt: Date | string): string {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });
}

export function buildOrderConfirmationEmail(
  firstName: string,
  orderNumber: string,
  orderData: OrderConfirmationData,
  origin = SITE_ORIGIN
): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(firstName || 'there');
  const safeOrderNumber = escapeHtml(orderNumber);
  const trackUrl = `${origin}/track-order?order=${encodeURIComponent(orderNumber)}`;
  const isCod = orderData.paymentMethod === 'cod';
  const paymentLabel = paymentMethodLabel(orderData.paymentMethod);
  const orderDate = formatOrderDate(orderData.createdAt);
  const totalLabel = isCod ? 'Amount due on delivery' : 'Total charged';
  const showLaunchNote = new Date(orderData.createdAt).getTime() < ORDERS_OPEN_AT.getTime();
  const addr = orderData.shippingAddress || ({} as OrderConfirmationAddress);
  const logoUrl = `${origin}/logo.png`;
  const preheader = isCod
    ? `We received your Petshiwu order ${orderNumber}. ${formatUsd(orderData.totalPrice)} is due when your driver arrives.`
    : `We received your Petshiwu order ${orderNumber} for ${formatUsd(orderData.totalPrice)}. Track it anytime.`;

  const itemRows = (orderData.items || []).map((item) => {
    const image = absoluteImageUrl(item.image, origin);
    const lineTotal = formatUsd(Number(item.price) * Number(item.quantity));
    return `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #E5E7EB;vertical-align:top;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="84" valign="top" style="padding-right:14px;">
                ${image
                  ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" width="72" height="72" style="width:72px;height:72px;border-radius:8px;border:1px solid #E5E7EB;object-fit:cover;display:block;">`
                  : `<div style="width:72px;height:72px;border-radius:8px;background:#F3F4F6;border:1px solid #E5E7EB;text-align:center;line-height:72px;color:${BRAND_NAVY};font-size:22px;font-weight:700;">P</div>`}
              </td>
              <td valign="top">
                <div style="font-size:15px;line-height:1.4;color:#111827;font-weight:600;">${escapeHtml(item.name)}</div>
                <div style="font-size:13px;color:#6B7280;margin-top:6px;">Qty ${escapeHtml(item.quantity)} &nbsp;·&nbsp; ${formatUsd(Number(item.price))} each</div>
              </td>
              <td width="90" valign="top" align="right" style="font-size:15px;font-weight:700;color:#111827;white-space:nowrap;">${lineTotal}</td>
            </tr>
          </table>
        </td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Your Petshiwu order ${safeOrderNumber}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #E5E7EB;">
          <tr>
            <td style="padding:22px 32px;border-bottom:1px solid #E5E7EB;">
              <a href="${origin}" style="text-decoration:none;">
                <img src="${logoUrl}" alt="Petshiwü" width="180" style="display:block;width:180px;height:auto;border:0;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND_NAVY};padding:14px 32px;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
              Order confirmed
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <h1 style="margin:0 0 10px;font-size:26px;line-height:1.25;color:#111827;">Hi ${safeName},</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">
                Thank you for shopping at Petshiwü. This is your official receipt for order <strong>${safeOrderNumber}</strong>${orderDate ? ` placed on ${escapeHtml(orderDate)}` : ''}.
              </p>
              ${showLaunchNote ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:#EFF6FF;border:1px solid #BFDBFE;padding:14px 16px;font-size:14px;line-height:1.5;color:#1E3A8A;">
                    Delivery starts ${ORDERS_OPEN_LABEL}. We will pack this order on launch day for NYC same-day delivery.
                  </td>
                </tr>
              </table>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;">
                <tr>
                  <td style="padding:14px 16px;width:50%;vertical-align:top;">
                    <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">Order number</div>
                    <div style="font-size:15px;color:#111827;font-weight:700;margin-top:4px;">${safeOrderNumber}</div>
                  </td>
                  <td style="padding:14px 16px;width:50%;vertical-align:top;">
                    <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">Payment</div>
                    <div style="font-size:15px;color:#111827;font-weight:700;margin-top:4px;">${escapeHtml(paymentLabel)}</div>
                    <div style="font-size:13px;color:#4B5563;margin-top:4px;">${isCod ? 'Pay the driver when your order arrives.' : 'Payment was received.'}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 8px;">
              <div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:8px;">Items</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6B7280;">Subtotal</td>
                  <td style="padding:6px 0;font-size:14px;color:#111827;text-align:right;">${formatUsd(orderData.itemsPrice)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6B7280;">Shipping</td>
                  <td style="padding:6px 0;font-size:14px;color:#111827;text-align:right;">${orderData.shippingPrice === 0 ? 'FREE' : formatUsd(orderData.shippingPrice)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6B7280;">Tax</td>
                  <td style="padding:6px 0;font-size:14px;color:#111827;text-align:right;">${formatUsd(orderData.taxPrice)}</td>
                </tr>
                ${orderData.donationAmount && orderData.donationAmount > 0 ? `
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6B7280;">Pet welfare donation</td>
                  <td style="padding:6px 0;font-size:14px;color:#111827;text-align:right;">${formatUsd(orderData.donationAmount)}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:12px 0 4px;font-size:16px;font-weight:700;color:#111827;border-top:2px solid #E5E7EB;">${totalLabel}</td>
                  <td style="padding:12px 0 4px;font-size:20px;font-weight:700;color:${BRAND_NAVY};text-align:right;border-top:2px solid #E5E7EB;">${formatUsd(orderData.totalPrice)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 8px;">
              <div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:8px;">Deliver to</div>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
                ${escapeHtml(addr.firstName)} ${escapeHtml(addr.lastName)}<br>
                ${escapeHtml(addr.street)}<br>
                ${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} ${escapeHtml(addr.zipCode)}<br>
                ${escapeHtml(addr.country)}${addr.phone ? `<br>${escapeHtml(addr.phone)}` : ''}
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px 8px;">
              <a href="${escapeHtml(trackUrl)}" style="display:inline-block;background:${BRAND_NAVY};color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:6px;">
                Track your order
              </a>
              <p style="margin:12px 0 0;font-size:13px;color:#6B7280;">
                Or visit <a href="${escapeHtml(trackUrl)}" style="color:${BRAND_NAVY};">${escapeHtml(origin.replace('https://', ''))}/track-order</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;">
                <tr>
                  <td width="33%" style="padding:14px 10px;text-align:center;font-size:12px;color:#374151;font-weight:600;">365-day returns</td>
                  <td width="33%" style="padding:14px 10px;text-align:center;font-size:12px;color:#374151;font-weight:600;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">NYC same-day delivery</td>
                  <td width="33%" style="padding:14px 10px;text-align:center;font-size:12px;color:#374151;font-weight:600;">Secure SSL checkout</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;font-size:13px;line-height:1.6;color:#6B7280;">
              Questions about this order? Email
              <a href="mailto:support@petshiwu.com" style="color:${BRAND_NAVY};font-weight:600;">support@petshiwu.com</a>
              or read our
              <a href="${origin}/return-policy" style="color:${BRAND_NAVY};font-weight:600;">return policy</a>.<br><br>
              Petshiwü · 37-68 74th Street, Jackson Heights, NY 11372<br>
              Office and warehouse only — delivery, not a walk-in store.<br>
              This email is a receipt for your purchase. You do not need to unsubscribe.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const itemLines = (orderData.items || [])
    .map((item) => `- ${item.name} x${item.quantity} — ${formatUsd(Number(item.price) * Number(item.quantity))}`)
    .join('\n');

  const text = [
    `Hi ${firstName || 'there'},`,
    '',
    `Thank you for your Petshiwu order ${orderNumber}${orderDate ? ` placed on ${orderDate}` : ''}.`,
    showLaunchNote ? `Delivery starts ${ORDERS_OPEN_LABEL}. We will pack this order on launch day.` : '',
    '',
    'Items',
    itemLines,
    '',
    `Subtotal: ${formatUsd(orderData.itemsPrice)}`,
    `Shipping: ${orderData.shippingPrice === 0 ? 'FREE' : formatUsd(orderData.shippingPrice)}`,
    `Tax: ${formatUsd(orderData.taxPrice)}`,
    `${totalLabel}: ${formatUsd(orderData.totalPrice)}`,
    '',
    `Payment: ${paymentLabel}${isCod ? ' (due when your driver arrives)' : ''}`,
    'Deliver to:',
    `${addr.firstName} ${addr.lastName}`,
    addr.street,
    `${addr.city}, ${addr.state} ${addr.zipCode}`,
    addr.country,
    addr.phone || '',
    '',
    `Track your order: ${trackUrl}`,
    '',
    '365-day returns · NYC same-day delivery · Secure checkout',
    'support@petshiwu.com',
    'Petshiwu, 37-68 74th Street, Jackson Heights, NY 11372',
  ].filter((line) => line !== '').join('\n');

  return {
    subject: `Your Petshiwu order ${orderNumber}`,
    html,
    text,
  };
}

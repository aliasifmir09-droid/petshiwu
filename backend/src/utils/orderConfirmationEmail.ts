const SITE_ORIGIN = 'https://www.petshiwu.com';
const BRAND_NAVY = '#1E3A8A';
const BRAND_GOLD = '#F59E0B';
const ORDERS_OPEN_AT = new Date('2026-08-28T00:00:00-04:00');
const ORDERS_OPEN_LABEL = 'August 28, 2026';
export const SUPPORT_PHONE_DISPLAY = '+1 (800) 259-2605';
export const SUPPORT_PHONE_TEL = '+18002592605';
export const WAREHOUSE_ADDRESS = '37-68 74th Street, Jackson Heights, NY 11372';

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
  customerEmail?: string;
  isGuestCheckout?: boolean;
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
  const totalLabel = isCod ? 'Amount due on delivery' : 'Total paid';
  const paymentStatus = isCod ? 'Due when the driver arrives' : 'Payment received';
  const showLaunchNote = new Date(orderData.createdAt).getTime() < ORDERS_OPEN_AT.getTime();
  const addr = orderData.shippingAddress || ({} as OrderConfirmationAddress);
  const shipName = `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
  const logoUrl = `${origin}/logo.png`;
  const customerEmail = String(orderData.customerEmail || '').trim();
  const guestPasswordUrl = customerEmail
    ? `${origin}/forgot-password?guest=1&email=${encodeURIComponent(customerEmail)}`
    : `${origin}/forgot-password?guest=1`;
  const showGuestPasswordHelp = Boolean(orderData.isGuestCheckout);
  const preheader = isCod
    ? `Packing slip for Petshiwu order ${orderNumber}. ${formatUsd(orderData.totalPrice)} is due when your driver arrives.`
    : `Packing slip and official receipt for Petshiwu order ${orderNumber} · ${formatUsd(orderData.totalPrice)}.`;

  const itemRows = (orderData.items || []).map((item) => {
    const image = absoluteImageUrl(item.image, origin);
    const lineTotal = formatUsd(Number(item.price) * Number(item.quantity));
    const thumb = image
      ? `<img src="${escapeHtml(image)}" alt="" width="64" height="64" style="width:64px;height:64px;border:1px solid #E5E7EB;object-fit:cover;display:block;background:#ffffff;">`
      : `<div style="width:64px;height:64px;background:#EFF6FF;border:1px solid #DBEAFE;text-align:center;line-height:64px;color:${BRAND_NAVY};font-size:18px;font-weight:800;">P</div>`;
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #E5E7EB;vertical-align:top;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="76" valign="top" style="padding-right:12px;">${thumb}</td>
              <td valign="middle">
                <div style="font-size:15px;line-height:1.4;color:#111827;font-weight:700;">${escapeHtml(item.name)}</div>
                <div style="font-size:13px;color:#6B7280;margin-top:4px;">${formatUsd(Number(item.price))} each</div>
              </td>
              <td width="54" valign="middle" align="center" style="font-size:15px;font-weight:700;color:#111827;">${escapeHtml(item.quantity)}</td>
              <td width="88" valign="middle" align="right" style="font-size:15px;font-weight:800;color:#111827;white-space:nowrap;">${lineTotal}</td>
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
  <title>Petshiwu packing slip ${safeOrderNumber}</title>
  <style>
    @page { margin: 0.5in; }
    @media print {
      body { background: #ffffff !important; }
      .ps-shell { padding: 0 !important; background: #ffffff !important; }
      .ps-card { border: 0 !important; }
      .ps-screen-only { display: none !important; }
      a { color: #111827 !important; text-decoration: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#EEF2FF;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" class="ps-shell" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2FF;padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" class="ps-card" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #C7D2FE;">

          <tr>
            <td style="padding:0;background:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 28px 16px;">
                    <a href="${origin}" style="text-decoration:none;">
                      <img src="${logoUrl}" alt="Petshiwü" width="188" style="display:block;width:188px;height:auto;border:0;">
                    </a>
                  </td>
                  <td width="220" valign="middle" align="right" style="padding:20px 28px 16px;">
                    <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND_NAVY};font-weight:800;">Order</div>
                    <div style="margin-top:6px;font-family:'Courier New',Courier,monospace;font-size:14px;line-height:1.3;font-weight:800;letter-spacing:0.03em;color:#111827;">${safeOrderNumber}</div>
                    ${orderDate ? `<div style="margin-top:6px;font-size:12px;color:#4B5563;">${escapeHtml(orderDate)}</div>` : ''}
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${BRAND_NAVY};padding:14px 28px;">
                    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#BFDBFE;font-weight:700;">Official receipt and packing slip</div>
                    <div style="margin-top:4px;font-size:18px;line-height:1.35;color:#ffffff;font-weight:800;">Print this page and include it in the package</div>
                  </td>
                </tr>
              </table>
              <div style="height:5px;background:${BRAND_GOLD};line-height:5px;font-size:0;">&nbsp;</div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#111827;">
                Hi ${safeName}, this is your Petshiwü receipt. Keep a copy and place one in the box so the delivery is easy to check.
              </p>
              ${showLaunchNote ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
                <tr>
                  <td style="background:#FFFBEB;border:1px solid #FCD34D;padding:12px 14px;font-size:14px;line-height:1.5;color:#92400E;">
                    We pack and deliver this order on ${ORDERS_OPEN_LABEL} for NYC same-day service.
                  </td>
                </tr>
              </table>` : ''}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #DBEAFE;background:#F8FAFC;">
                <tr>
                  <td width="50%" valign="top" style="padding:14px 16px;border-right:1px solid #DBEAFE;">
                    <div style="font-size:11px;color:${BRAND_NAVY};text-transform:uppercase;letter-spacing:0.08em;font-weight:800;">Payment</div>
                    <div style="margin-top:6px;font-size:16px;font-weight:800;color:#111827;">${escapeHtml(paymentLabel)}</div>
                    <div style="margin-top:4px;font-size:13px;font-weight:700;color:${isCod ? '#B45309' : '#047857'};">${escapeHtml(paymentStatus)}</div>
                  </td>
                  <td width="50%" valign="top" style="padding:14px 16px;">
                    <div style="font-size:11px;color:${BRAND_NAVY};text-transform:uppercase;letter-spacing:0.08em;font-weight:800;">${escapeHtml(totalLabel)}</div>
                    <div style="margin-top:6px;font-size:26px;line-height:1;font-weight:800;color:${BRAND_NAVY};">${formatUsd(orderData.totalPrice)}</div>
                    <div style="margin-top:6px;font-size:12px;color:#4B5563;">USD · 365-day returns</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" valign="top" style="padding-right:10px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;min-height:160px;">
                      <tr>
                        <td style="padding:14px 16px;">
                          <div style="font-size:11px;color:${BRAND_NAVY};text-transform:uppercase;letter-spacing:0.08em;font-weight:800;">Ship to</div>
                          <div style="margin-top:8px;font-size:16px;font-weight:800;color:#111827;">${escapeHtml(shipName)}</div>
                          <div style="margin-top:6px;font-size:14px;line-height:1.55;color:#374151;">
                            ${escapeHtml(addr.street)}<br>
                            ${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} ${escapeHtml(addr.zipCode)}<br>
                            ${escapeHtml(addr.country)}
                          </div>
                          ${customerEmail ? `<div style="margin-top:8px;font-size:13px;color:${BRAND_NAVY};">${escapeHtml(customerEmail)}</div>` : ''}
                          ${addr.phone ? `<div style="margin-top:4px;font-size:13px;color:#111827;">${escapeHtml(addr.phone)}</div>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" valign="top" style="padding-left:10px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;">
                      <tr>
                        <td style="padding:14px 16px;">
                          <div style="font-size:11px;color:${BRAND_NAVY};text-transform:uppercase;letter-spacing:0.08em;font-weight:800;">Ship from</div>
                          <div style="margin-top:8px;font-size:16px;font-weight:800;color:#111827;">Petshiwü</div>
                          <div style="margin-top:6px;font-size:14px;line-height:1.55;color:#374151;">
                            ${WAREHOUSE_ADDRESS}<br>
                            Office and warehouse only<br>
                            Not a walk-in store
                          </div>
                          <div style="margin-top:8px;font-size:13px;font-weight:700;color:${BRAND_NAVY};">
                            <a href="tel:${SUPPORT_PHONE_TEL}" style="color:${BRAND_NAVY};text-decoration:none;">${SUPPORT_PHONE_DISPLAY}</a>
                            <span style="color:#6B7280;font-weight:600;"> · 24/7</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:11px;color:${BRAND_NAVY};text-transform:uppercase;letter-spacing:0.08em;font-weight:800;padding-bottom:8px;">Packed items</td>
                  <td align="center" width="54" style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;font-weight:800;padding-bottom:8px;">Qty</td>
                  <td align="right" width="88" style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;font-weight:800;padding-bottom:8px;">Amount</td>
                </tr>
                ${itemRows}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:5px 0;font-size:14px;color:#6B7280;">Subtotal</td>
                  <td style="padding:5px 0;font-size:14px;color:#111827;text-align:right;">${formatUsd(orderData.itemsPrice)}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:14px;color:#6B7280;">Shipping</td>
                  <td style="padding:5px 0;font-size:14px;color:#111827;text-align:right;font-weight:700;">${orderData.shippingPrice === 0 ? 'FREE' : formatUsd(orderData.shippingPrice)}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:14px;color:#6B7280;">Tax</td>
                  <td style="padding:5px 0;font-size:14px;color:#111827;text-align:right;">${formatUsd(orderData.taxPrice)}</td>
                </tr>
                ${orderData.donationAmount && orderData.donationAmount > 0 ? `
                <tr>
                  <td style="padding:5px 0;font-size:14px;color:#6B7280;">Pet welfare donation</td>
                  <td style="padding:5px 0;font-size:14px;color:#111827;text-align:right;">${formatUsd(orderData.donationAmount)}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:12px 0 2px;font-size:15px;font-weight:800;color:#111827;border-top:2px solid ${BRAND_NAVY};">${totalLabel}</td>
                  <td style="padding:12px 0 2px;font-size:22px;font-weight:800;color:${BRAND_NAVY};text-align:right;border-top:2px solid ${BRAND_NAVY};">${formatUsd(orderData.totalPrice)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr class="ps-screen-only">
            <td align="center" style="padding:18px 28px 6px;">
              <a href="${escapeHtml(trackUrl)}" style="display:inline-block;background:${BRAND_NAVY};color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;padding:13px 26px;">
                Track this order
              </a>
            </td>
          </tr>
          ${showGuestPasswordHelp ? `
          <tr class="ps-screen-only">
            <td style="padding:8px 28px 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #FCD34D;background:#FFFBEB;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:15px;font-weight:800;color:#92400E;">You checked out as a guest — no password needed</div>
                    <div style="margin-top:8px;font-size:14px;line-height:1.55;color:#78350F;">
                      Continue with Google using ${customerEmail ? escapeHtml(customerEmail) : 'the Gmail from this order'}. That signs you in and shows this order. You can also create a password if you prefer.
                    </div>
                    <div style="margin-top:14px;">
                      <a href="${origin}/login" style="display:inline-block;background:${BRAND_NAVY};color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:11px 20px;margin-right:10px;">
                        Continue with Google
                      </a>
                      <a href="${escapeHtml(guestPasswordUrl)}" style="display:inline-block;color:${BRAND_NAVY};font-size:14px;font-weight:800;text-decoration:underline;padding:11px 0;">
                        Create a password
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''}

          <tr>
            <td style="padding:14px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_NAVY};">
                <tr>
                  <td style="padding:16px 18px;text-align:center;color:#ffffff;">
                    <div style="font-size:15px;font-weight:800;">Questions? Call us 24 hours a day</div>
                    <div style="margin-top:8px;font-size:22px;font-weight:800;letter-spacing:0.02em;">
                      <a href="tel:${SUPPORT_PHONE_TEL}" style="color:#ffffff;text-decoration:none;">${SUPPORT_PHONE_DISPLAY}</a>
                    </div>
                    <div style="margin-top:6px;font-size:12px;color:#BFDBFE;">A real person answers day and night · support@petshiwu.com</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;">
                <tr>
                  <td width="33%" style="padding:12px 8px;text-align:center;font-size:12px;color:#1F2937;font-weight:700;">365-day returns</td>
                  <td width="33%" style="padding:12px 8px;text-align:center;font-size:12px;color:#1F2937;font-weight:700;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">NYC same-day delivery</td>
                  <td width="33%" style="padding:12px 8px;text-align:center;font-size:12px;color:#1F2937;font-weight:700;">Secure checkout</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 24px;font-size:12px;line-height:1.6;color:#6B7280;">
              Include this packing slip in the shipment. Returns: unused items within 365 days; customer pays return shipping unless the item is damaged, defective, or incorrect.
              <a href="${origin}/return-policy" style="color:${BRAND_NAVY};font-weight:700;">petshiwu.com/return-policy</a><br><br>
              Petshiwü · ${WAREHOUSE_ADDRESS}<br>
              Office and warehouse only — delivery, not a walk-in store.
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
    'PETSHIWU — OFFICIAL RECEIPT AND PACKING SLIP',
    'Print this page and include it in the package.',
    '',
    `Hi ${firstName || 'there'},`,
    `Order ${orderNumber}${orderDate ? ` placed on ${orderDate}` : ''}.`,
    showLaunchNote ? `We pack and deliver this order on ${ORDERS_OPEN_LABEL}.` : '',
    '',
    'Packed items',
    itemLines,
    '',
    `Subtotal: ${formatUsd(orderData.itemsPrice)}`,
    `Shipping: ${orderData.shippingPrice === 0 ? 'FREE' : formatUsd(orderData.shippingPrice)}`,
    `Tax: ${formatUsd(orderData.taxPrice)}`,
    `${totalLabel}: ${formatUsd(orderData.totalPrice)}`,
    '',
    `Payment: ${paymentLabel} — ${paymentStatus}`,
    'Ship to:',
    shipName,
    addr.street,
    `${addr.city}, ${addr.state} ${addr.zipCode}`,
    addr.country,
    customerEmail,
    addr.phone || '',
    '',
    `Ship from: Petshiwu, ${WAREHOUSE_ADDRESS}`,
    `Track: ${trackUrl}`,
    showGuestPasswordHelp
      ? `You checked out as a guest. Continue with Google at ${origin}/login using the same Gmail, or create a password: ${guestPasswordUrl}`
      : '',
    '',
    `Call support 24/7: ${SUPPORT_PHONE_DISPLAY}`,
    'support@petshiwu.com',
    '365-day returns · NYC same-day delivery · Secure checkout',
  ].filter((line) => line !== '').join('\n');

  return {
    subject: `Your Petshiwu packing slip ${orderNumber}`,
    html,
    text,
  };
}

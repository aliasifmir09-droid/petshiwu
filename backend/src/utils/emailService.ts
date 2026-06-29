import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import logger from './logger';
import EmailTemplate from '../models/EmailTemplate';

// Helper to get a clean frontend base URL (handles comma-separated env values)
const getFrontendBaseUrl = (): string => {
  const raw =
    process.env.FRONTEND_URL ||
    process.env.SITE_URL ||
    process.env.CORS_ORIGIN ||
    'https://www.petshiwu.com';

  // If someone set multiple domains comma-separated, pick the first valid one
  const first = raw.split(',')[0]?.trim();
  if (!first) {
    return 'https://www.petshiwu.com';
  }
  // Ensure no trailing slash to keep URL building consistent
  return first.replace(/\/+$/, '');
};

// Initialize Resend client if API key is provided
let resendClient: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
  logger.info('✅ Resend API client initialized');
}

// Create reusable transporter
const createTransporter = () => {
  // If SMTP is configured, use it (works with GoDaddy, custom SMTP servers, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true';
    
    logger.info(`Creating SMTP transporter: ${process.env.SMTP_HOST}:${port}, secure: ${secure}`);
    
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: secure, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // Add timeout and connection options for cloud environments
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
      // For Render/cloud environments - allow self-signed certificates if needed
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Development/Test mode - No email configuration
  // Emails won't actually be sent, but verification links will be logged to console
  logger.warn('⚠️  No email configuration found. Using test mode (emails won\'t be sent).');
  logger.warn('⚠️  To enable email sending, configure SMTP_HOST, SMTP_USER, and SMTP_PASS in your .env file.');
  
  // Return a test transporter that won't actually send emails
  // In development, this prevents errors but emails won't be delivered
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'test@ethereal.email',
      pass: 'test'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Helper function to get email template from database or use default
const getEmailTemplate = async (templateName: string, defaultSubject: string, defaultBody: string): Promise<{ subject: string; body: string }> => {
  try {
    const template = await EmailTemplate.findOne({ name: templateName, isActive: true }).lean();
    if (template) {
      return {
        subject: template.subject,
        body: template.body
      };
    }
  } catch (error) {
    logger.warn(`Could not load email template "${templateName}", using default`);
  }
  return { subject: defaultSubject, body: defaultBody };
};

// Helper function to replace template variables
const replaceTemplateVariables = (template: string, variables: Record<string, any>): string => {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value || ''));
  }
  return result;
};

// Send email verification
export const sendVerificationEmail = async (email: string, token: string, firstName: string) => {
  try {
    // Check if email is actually configured
    const isEmailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    
    if (!isEmailConfigured) {
      logger.warn(`⚠️  Email not configured. Skipping verification email to ${email}.`);
      logger.warn(`⚠️  In development, you can verify manually or configure email settings.`);
      // In development/test mode, log the verification link instead
      const frontendUrl = getFrontendBaseUrl();
      const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
      logger.info(`📧 Verification link for ${email}: ${verificationUrl}`);
      return { messageId: 'test-mode', accepted: [email] };
    }

    const transporter = createTransporter();
    const frontendUrl = getFrontendBaseUrl();
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@petshiwu.com',
      to: email,
      subject: 'Verify Your Email Address - Petshiwu',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">Welcome to Petshiwu!</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
            <p>Hi ${firstName},</p>
            <p>Thank you for registering with Petshiwu! Please verify your email address to complete your registration.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${verificationUrl}</p>
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
              This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Best regards,<br>
              The Petshiwu Team
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Petshiwu!
        
        Hi ${firstName},
        
        Thank you for registering with Petshiwu! Please verify your email address by clicking the link below:
        
        ${verificationUrl}
        
        This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        
        Best regards,
        The Petshiwu Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Verification email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error: any) {
    logger.error(`❌ Error sending verification email to ${email}:`, error.message);
    // In development, don't fail completely - log the link
    if (process.env.NODE_ENV !== 'production') {
      const frontendUrl = getFrontendBaseUrl();
      const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
      logger.warn(`📧 Fallback verification link for ${email}: ${verificationUrl}`);
    }
    throw error;
  }
};

// Send order confirmation email (with template support)
export const sendOrderConfirmationEmail = async (
  email: string,
  firstName: string,
  orderNumber: string,
  orderData: {
    orderId?: string;
    items: Array<{ name: string; quantity: number; price: number; image?: string }>;
    totalPrice: number;
    itemsPrice: number;
    shippingPrice: number;
    taxPrice: number;
    donationAmount?: number;
    shippingAddress: {
      firstName: string;
      lastName: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    paymentMethod: string;
    orderStatus: string;
    createdAt: Date;
  }
) => {
  try {
    const frontendUrl = getFrontendBaseUrl();
    // Use MongoDB _id for the URL — orderNumber format is rejected by the order detail page
    const orderUrl = `${frontendUrl}/orders/${orderData.orderId || orderNumber}`;
    const isCOD = orderData.paymentMethod === 'cod';
    const paymentLabel = isCOD ? 'Cash on Delivery (COD)' : orderData.paymentMethod.replace(/_/g, ' ');

    // ── Item rows (dark premium style) ───────────────────────
    const itemRows = orderData.items.map(item => `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #1e3a5c;vertical-align:top;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="72" valign="top" style="padding-right:14px;">
                ${item.image
                  ? `<img src="${item.image}" alt="${item.name}" width="64" height="64"
                       style="width:64px;height:64px;border-radius:12px;object-fit:cover;
                              border:1px solid #1e3a5c;display:block;">`
                  : `<div style="width:64px;height:64px;background:#1a2e45;border-radius:12px;
                                 text-align:center;line-height:64px;font-size:26px;border:1px solid #1e3a5c;">🐾</div>`}
              </td>
              <td valign="middle">
                <div style="font-size:14px;font-weight:700;color:#ffffff;line-height:1.4;margin-bottom:10px;">${item.name}</div>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:16px;">
                      <div style="display:inline-flex;align-items:center;background:#1a2e45;border:1px solid #1e3a5c;
                                  border-radius:8px;padding:5px 10px;">
                        <span style="font-size:12px;color:#7aa3c8;font-weight:600;text-transform:uppercase;
                                     letter-spacing:0.5px;margin-right:6px;">📦 QTY:</span>
                        <span style="font-size:13px;font-weight:800;color:#ffffff;">${item.quantity}</span>
                      </div>
                    </td>
                    <td>
                      <div style="display:inline-flex;align-items:center;background:#1a2e45;border:1px solid #1e3a5c;
                                  border-radius:8px;padding:5px 10px;">
                        <span style="font-size:12px;color:#7aa3c8;font-weight:600;text-transform:uppercase;
                                     letter-spacing:0.5px;margin-right:6px;">💵 AMOUNT:</span>
                        <span style="font-size:13px;font-weight:800;color:#60d394;">$${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`).join('');

    // ── Full HTML email (dark premium) ────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Order Confirmed – Petshiwu</title>
</head>
<body style="margin:0;padding:0;background:#071828;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#071828;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0"
             style="max-width:580px;width:100%;background:#0d2137;
                    border-radius:24px;overflow:hidden;
                    border:1px solid #1a3550;">

        <!-- ── HEADER ── -->
        <tr>
          <td style="padding:44px 40px 36px;text-align:center;background:#0d2137;">

            <!-- Logo -->
            <div style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;margin-bottom:4px;">
              🐾 Petshiwu
            </div>
            <div style="font-size:12px;color:#7aa3c8;letter-spacing:1px;margin-bottom:28px;">
              — For the love of pets —
            </div>

            <!-- ORDER CONFIRMED badge -->
            <div style="display:inline-block;background:#0f4c2a;border:1px solid #1a7a44;
                        border-radius:50px;padding:8px 22px;margin-bottom:24px;">
              <span style="color:#60d394;font-size:13px;font-weight:700;
                           text-transform:uppercase;letter-spacing:1.2px;">
                ✓ &nbsp;Order Confirmed
              </span>
            </div>

            <h1 style="margin:0 0 10px;color:#ffffff;font-size:32px;font-weight:900;line-height:1.2;">
              Thank You, ${firstName}! 🎉
            </h1>
            <p style="margin:0 0 28px;color:#7aa3c8;font-size:15px;line-height:1.5;">
              Your furry friend is going to love this order.
            </p>

            <!-- Order number card -->
            <div style="background:#112840;border:1px solid #1a3550;border-radius:14px;
                        padding:16px 28px;display:inline-block;">
              <div style="font-size:11px;color:#7aa3c8;font-weight:700;text-transform:uppercase;
                          letter-spacing:1px;margin-bottom:6px;">📋 Order Number</div>
              <div style="color:#ffffff;font-size:20px;font-weight:900;letter-spacing:1px;">
                #${orderNumber}
              </div>
            </div>
          </td>
        </tr>

        <!-- ── TAGLINE ── -->
        <tr>
          <td style="padding:20px 40px;text-align:center;background:#0a1e30;
                     border-top:1px solid #1a3550;border-bottom:1px solid #1a3550;">
            <div style="font-size:22px;margin-bottom:8px;">🐕 🐈 🐦 🐠</div>
            <p style="margin:0;font-size:14px;color:#7aa3c8;font-style:italic;line-height:1.6;">
              Premium care for every paw, wing, fin &amp; claw —<br>delivered to your door.
            </p>
          </td>
        </tr>

        <!-- ── YOUR ITEMS ── -->
        <tr>
          <td style="padding:28px 28px 8px;">
            <div style="font-size:16px;font-weight:800;color:#ffffff;margin-bottom:14px;">
              🛍 Your Items
            </div>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border-collapse:collapse;background:#112840;
                          border-radius:14px;overflow:hidden;border:1px solid #1a3550;">
              <tbody>
                ${itemRows}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- ── ORDER TOTAL ── -->
        <tr>
          <td style="padding:16px 28px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#112840;border:1px solid #1a3550;border-radius:14px;overflow:hidden;">
              <tr>
                <td style="padding:12px 20px;font-size:14px;color:#7aa3c8;border-bottom:1px solid #1a3550;">Subtotal</td>
                <td style="padding:12px 20px;font-size:14px;color:#ffffff;font-weight:600;
                           text-align:right;border-bottom:1px solid #1a3550;">
                  $${orderData.itemsPrice.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style="padding:12px 20px;font-size:14px;color:#7aa3c8;border-bottom:1px solid #1a3550;">Shipping</td>
                <td style="padding:12px 20px;font-size:14px;text-align:right;font-weight:700;border-bottom:1px solid #1a3550;">
                  ${orderData.shippingPrice === 0
                    ? '<span style="color:#60d394;">FREE</span>'
                    : `<span style="color:#ffffff;">$${orderData.shippingPrice.toFixed(2)}</span>`}
                </td>
              </tr>
              <tr>
                <td style="padding:12px 20px;font-size:14px;color:#7aa3c8;border-bottom:1px solid #1a3550;">Tax</td>
                <td style="padding:12px 20px;font-size:14px;color:#ffffff;font-weight:600;
                           text-align:right;border-bottom:1px solid #1a3550;">
                  $${orderData.taxPrice.toFixed(2)}
                </td>
              </tr>
              ${orderData.donationAmount && orderData.donationAmount > 0 ? `
              <tr>
                <td style="padding:12px 20px;font-size:14px;color:#60d394;border-bottom:1px solid #1a3550;">
                  ❤️ Pet Welfare Donation
                </td>
                <td style="padding:12px 20px;font-size:14px;color:#60d394;font-weight:700;
                           text-align:right;border-bottom:1px solid #1a3550;">
                  +$${orderData.donationAmount.toFixed(2)}
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding:16px 20px;font-size:16px;font-weight:800;color:#ffffff;">Total Paid</td>
                <td style="padding:16px 20px;font-size:22px;font-weight:900;color:#60d394;text-align:right;">
                  $${orderData.totalPrice.toFixed(2)}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── SHIPPING + PAYMENT ── -->
        <tr>
          <td style="padding:16px 28px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48%" valign="top"
                    style="background:#112840;border:1px solid #1a3550;border-radius:14px;padding:18px;">
                  <div style="font-size:11px;font-weight:700;color:#7aa3c8;
                              text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">
                    📦 Delivering To
                  </div>
                  <div style="font-size:14px;font-weight:700;color:#ffffff;margin-bottom:6px;">
                    ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}
                  </div>
                  <div style="font-size:13px;color:#7aa3c8;line-height:1.7;">
                    ${orderData.shippingAddress.street}<br>
                    ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}<br>
                    ${orderData.shippingAddress.country}
                  </div>
                </td>
                <td width="4%"></td>
                <td width="48%" valign="top"
                    style="background:#112840;border:1px solid #1a3550;border-radius:14px;padding:18px;">
                  <div style="font-size:11px;font-weight:700;color:#7aa3c8;
                              text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">
                    💳 Payment
                  </div>
                  <div style="font-size:14px;font-weight:700;color:#ffffff;
                              text-transform:capitalize;margin-bottom:6px;">
                    ${paymentLabel}
                  </div>
                  <div style="font-size:13px;color:#7aa3c8;line-height:1.7;">
                    ${isCOD
                      ? 'Our driver will collect payment at your door.'
                      : 'Payment successfully processed.'}
                  </div>
                  ${isCOD
                    ? `<div style="margin-top:10px;background:#2a1f0a;border:1px solid #7a5c1a;
                                  border-radius:8px;padding:7px 12px;font-size:12px;color:#f0b429;font-weight:600;">
                         💡 Please keep exact change ready
                       </div>`
                    : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── CTA ── -->
        <tr>
          <td style="padding:24px 28px;text-align:center;">
            <a href="${orderUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#1a56db,#0e3fa5);
                      color:#ffffff;font-size:15px;font-weight:800;padding:15px 44px;
                      text-decoration:none;border-radius:50px;
                      box-shadow:0 4px 20px rgba(26,86,219,0.5);letter-spacing:0.3px;">
              Track My Order →
            </a>
            <p style="margin:12px 0 0;font-size:12px;color:#4a7090;">
              We'll email you when your order ships.
            </p>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="padding:24px 40px 28px;text-align:center;
                     border-top:1px solid #1a3550;">
            <div style="font-size:22px;margin-bottom:10px;">🐾 &nbsp; 🐾 &nbsp; 🐾</div>
            <p style="margin:0 0 6px;font-size:14px;color:#7aa3c8;font-style:italic;">
              We're happy to be a part of your pet's journey.
            </p>
            <p style="margin:0 0 14px;font-size:13px;color:#4a7090;font-weight:600;">
              — The Petshiwu.Team 🐾
            </p>
            <a href="https://www.petshiwu.com"
               style="color:#3b82f6;font-size:13px;text-decoration:none;font-weight:600;">
              www.petshiwu.com
            </a>
            <p style="margin:14px 0 0;font-size:11px;color:#2a4a60;">
              © ${new Date().getFullYear()} Petshiwu &nbsp;·&nbsp; Jackson Heights, Queens, New York
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;

    // ── Send via Resend (preferred) or SMTP fallback ─────────
    if (resendClient) {
      const result = await resendClient.emails.send({
        from: 'Petshiwu Orders <noreply@petshiwu.com>',
        to: email,
        subject: `🎉 Order Confirmed! #${orderNumber} – Thank You, ${firstName}!`,
        html,
      });
      logger.info(`✅ Order confirmation email sent via Resend to ${email} — ID: ${result.data?.id}`);
      return result;
    }

    // SMTP fallback
    const isSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!isSmtpConfigured) {
      logger.warn(`⚠️  No email provider configured. Order #${orderNumber} confirmed but email not sent.`);
      return { messageId: 'no-provider', accepted: [email] };
    }
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@petshiwu.com',
      to: email,
      subject: `🎉 Order Confirmed! #${orderNumber} – Thank You, ${firstName}!`,
      html,
    });
    logger.info(`✅ Order confirmation email sent via SMTP to ${email}: ${info.messageId}`);
    return info;

  } catch (error: any) {
    logger.error(`❌ Error sending order confirmation email to ${email}:`, error.message);
    return null;
  }
};

// Send order cancellation email
export const sendOrderCancellationEmail = async (
  email: string,
  firstName: string,
  orderNumber: string,
  orderData: {
    items: Array<{ name: string; quantity: number; price: number; image?: string }>;
    totalPrice: number;
    cancellationReason?: string;
    refundAmount?: number;
    createdAt: Date;
  }
) => {
  try {
    // Check if email is actually configured
    const isEmailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    
    if (!isEmailConfigured) {
      logger.warn(`⚠️  Email not configured. Skipping order cancellation email to ${email}.`);
      logger.warn(`⚠️  Order #${orderNumber} cancelled, but cancellation email not sent.`);
      return { messageId: 'test-mode', accepted: [email] };
    }

    // Get template from database or use default
    const defaultSubject = `Order Cancelled #${orderNumber} - Petshiwu`;
    const defaultBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Cancelled</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">Order Cancelled</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Order #{{orderNumber}}</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <p>Hi {{firstName}},</p>
          <p>We're sorry to inform you that your order has been cancelled.</p>
          {{#if cancellationReason}}
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
            <strong>Reason:</strong> {{cancellationReason}}
          </div>
          {{/if}}
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Order Details</h3>
            <p><strong>Order Number:</strong> {{orderNumber}}</p>
            <p><strong>Order Date:</strong> {{orderDate}}</p>
            <p><strong>Total Amount:</strong> ${'$'}{{totalPrice}}</p>
            {{#if refundAmount}}
            <p style="color: #4CAF50; font-weight: bold;"><strong>Refund Amount:</strong> ${'$'}{{refundAmount}}</p>
            <p style="color: #666; font-size: 14px;">Your refund will be processed within 5-7 business days.</p>
            {{/if}}
          </div>
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            If you have any questions or concerns, please contact our customer service team.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Best regards,<br>
            The Petshiwu Team
          </p>
        </div>
      </body>
      </html>
    `;

    const template = await getEmailTemplate('order_cancellation', defaultSubject, defaultBody);
    
    const variables = {
      firstName,
      orderNumber,
      orderDate: new Date(orderData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      totalPrice: orderData.totalPrice.toFixed(2),
      cancellationReason: orderData.cancellationReason || 'Customer request',
      refundAmount: orderData.refundAmount ? orderData.refundAmount.toFixed(2) : ''
    };

    let subject = replaceTemplateVariables(template.subject, variables);
    let body = replaceTemplateVariables(template.body, variables);
    
    // Simple replacement for conditional blocks (basic implementation)
    if (orderData.cancellationReason) {
      body = body.replace(/{{#if cancellationReason}}([\s\S]*?){{\/if}}/g, '$1');
    } else {
      body = body.replace(/{{#if cancellationReason}}[\s\S]*?{{\/if}}/g, '');
    }
    
    if (orderData.refundAmount) {
      body = body.replace(/{{#if refundAmount}}([\s\S]*?){{\/if}}/g, '$1');
    } else {
      body = body.replace(/{{#if refundAmount}}[\s\S]*?{{\/if}}/g, '');
    }

    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@petshiwu.com',
      to: email,
      subject,
      html: body,
      text: body.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n\n')
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Order cancellation email sent to ${email} for order #${orderNumber}: ${info.messageId}`);
    return info;
  } catch (error: any) {
    logger.error(`❌ Error sending order cancellation email to ${email}:`, error.message);
    return null;
  }
};

// Send order delivered email
export const sendOrderDeliveredEmail = async (
  email: string,
  firstName: string,
  orderNumber: string,
  orderData: {
    items: Array<{ name: string; quantity: number; price: number; image?: string }>;
    totalPrice: number;
    trackingNumber?: string;
    deliveredAt: Date;
    shippingAddress: {
      firstName: string;
      lastName: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  }
) => {
  try {
    // Check if email is actually configured
    const isEmailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    
    if (!isEmailConfigured) {
      logger.warn(`⚠️  Email not configured. Skipping order delivered email to ${email}.`);
      logger.warn(`⚠️  Order #${orderNumber} delivered, but delivery email not sent.`);
      return { messageId: 'test-mode', accepted: [email] };
    }

    // Get template from database or use default
    const defaultSubject = `Order Delivered #${orderNumber} - Petshiwu`;
    const defaultBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Delivered</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">🎉 Order Delivered!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Order #{{orderNumber}}</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <p>Hi {{firstName}},</p>
          <p>Great news! Your order has been successfully delivered.</p>
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Delivery Information</h3>
            <p><strong>Order Number:</strong> {{orderNumber}}</p>
            <p><strong>Delivered On:</strong> {{deliveredDate}}</p>
            {{#if trackingNumber}}
            <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
            {{/if}}
            <p><strong>Delivery Address:</strong><br>
            {{shippingAddress}}
            </p>
          </div>
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0; color: #2e7d32;">We'd Love Your Feedback!</h3>
            <p>Your opinion matters to us. Please take a moment to review your products and help other customers make informed decisions.</p>
            <a href="https://www.google.com/maps?cid=7967426977090267497&action=write-review" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin-top: 10px;">
              ⭐ Leave Us a Google Review
            </a>
          </div>
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            If you have any questions or concerns about your order, please contact our customer service team.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Thank you for shopping with us!<br>
            The Petshiwu Team
          </p>
        </div>
      </body>
      </html>
    `;

    const template = await getEmailTemplate('order_delivered', defaultSubject, defaultBody);
    
    const frontendUrl = getFrontendBaseUrl();
    const shippingAddress = `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}\n${orderData.shippingAddress.street}\n${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}\n${orderData.shippingAddress.country}`;
    
    const variables = {
      firstName,
      orderNumber,
      deliveredDate: new Date(orderData.deliveredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      trackingNumber: orderData.trackingNumber || '',
      shippingAddress: shippingAddress.replace(/\n/g, '<br>'),
      frontendUrl,
      orderId: orderNumber // Using orderNumber as orderId for now
    };

    let subject = replaceTemplateVariables(template.subject, variables);
    let body = replaceTemplateVariables(template.body, variables);
    
    // Simple replacement for conditional blocks
    if (orderData.trackingNumber) {
      body = body.replace(/{{#if trackingNumber}}([\s\S]*?){{\/if}}/g, '$1');
    } else {
      body = body.replace(/{{#if trackingNumber}}[\s\S]*?{{\/if}}/g, '');
    }

    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@petshiwu.com',
      to: email,
      subject,
      html: body,
      text: body.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n\n')
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Order delivered email sent to ${email} for order #${orderNumber}: ${info.messageId}`);
    return info;
  } catch (error: any) {
    logger.error(`❌ Error sending order delivered email to ${email}:`, error.message);
    return null;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, token: string, firstName: string) => {
  try {
    const frontendUrl = getFrontendBaseUrl();
    // Use HashRouter format (#/) for frontend routing
    const resetUrl = `${frontendUrl}/#/reset-password?token=${token}`;
    const fromEmail = process.env.SMTP_FROM || process.env.RESEND_FROM || 'noreply@petshiwu.com';

    // Try Resend API first (more reliable, no port blocking)
    if (resendClient && process.env.RESEND_API_KEY) {
      try {
        logger.info(`Sending password reset email via Resend API to ${email}`);
        
        const { data, error } = await resendClient.emails.send({
          from: fromEmail,
          to: email,
          subject: 'Reset Your Password - Petshiwu',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reset Your Password</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                <h1 style="margin: 0;">Password Reset Request</h1>
              </div>
              <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
                <p>Hi ${firstName},</p>
                <p>We received a request to reset your password. Click the button below to reset it:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background-color: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Reset Password
                  </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
                  This reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                </p>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">
                  Best regards,<br>
                  The Petshiwu Team
                </p>
              </div>
            </body>
            </html>
          `,
        });

        if (error) {
          throw new Error(`Resend API error: ${error.message}`);
        }

        logger.info(`✅ Password reset email sent via Resend API to ${email}: ${data?.id}`);
        return { messageId: data?.id || 'resend-api', accepted: [email] };
      } catch (resendError: any) {
        logger.warn(`Resend API failed, falling back to SMTP: ${resendError.message}`);
        // Fall through to SMTP
      }
    }

    // Fallback to SMTP if Resend API is not configured or failed
    // Check if email is actually configured
    const isEmailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    
    if (!isEmailConfigured) {
      logger.warn(`⚠️  Email not configured. Skipping password reset email to ${email}.`);
      logger.warn(`⚠️  In development, you can use the reset link below.`);
      // In development/test mode, log the reset link instead
      logger.info(`📧 Password reset link for ${email}: ${resetUrl}`);
      return { messageId: 'test-mode', accepted: [email] };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@petshiwu.com',
      to: email,
      subject: 'Reset Your Password - Petshiwu',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">Password Reset Request</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
              This reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Best regards,<br>
              The Petshiwu Team
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hi ${firstName},
        
        We received a request to reset your password. Click the link below to reset it:
        
        ${resetUrl}
        
        This reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        
        Best regards,
        The Petshiwu Team
      `
    };

    // Try to verify connection (optional - don't fail if verify fails, just log)
    try {
      await transporter.verify();
      logger.info('✅ SMTP connection verified');
    } catch (verifyError: any) {
      // Log warning but continue - sometimes verify fails but sendMail works
      logger.warn('⚠️  SMTP connection verification failed (will attempt to send anyway):', {
        error: verifyError.message,
        code: verifyError.code
      });
    }

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Password reset email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error: any) {
    // Log detailed error information
    logger.error(`❌ Error sending password reset email to ${email}:`, {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack
    });
    
    // In development, don't fail completely - log the link
    if (process.env.NODE_ENV !== 'production') {
      const frontendUrl = getFrontendBaseUrl();
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
      logger.warn(`📧 Fallback password reset link for ${email}: ${resetUrl}`);
    }
    throw error;
  }
};

/**
 * Send cart abandonment recovery email
 */
// ── Admin new-order notification ─────────────────────────────────────────────
export const sendAdminNewOrderEmail = async (orderData: {
  orderNumber: string;
  orderId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalPrice: number;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  paymentMethod: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}): Promise<void> => {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'admin@petshiwu.com';
  try {
    if (!resendClient) {
      logger.warn('⚠️  Resend not configured — skipping admin order notification');
      return;
    }

    const frontendUrl = getFrontendBaseUrl();
    const adminOrderUrl = `${frontendUrl.replace('www.petshiwu.com', 'admin.petshiwu.com')}/orders`;
    const isCOD = orderData.paymentMethod === 'cod';
    const paymentLabel = isCOD ? 'Cash on Delivery (COD)' : orderData.paymentMethod.replace(/_/g, ' ');

    const itemRows = orderData.items.map(item => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#1a1a2e;">${item.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#555;text-align:center;">×${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:700;color:#1a1a2e;text-align:right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>New Order Alert</title></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:24px 0;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.07);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1a56db 0%,#0e3fa5 100%);padding:28px 36px;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🐾 Petshiwu — Admin Alert</div>
          <h1 style="margin:0 0 6px;color:#fff;font-size:26px;font-weight:900;">🛍️ New Order Received!</h1>
          <div style="color:rgba(255,255,255,0.85);font-size:15px;">Order <strong>#${orderData.orderNumber}</strong></div>
        </td>
      </tr>

      <!-- Customer + Payment row -->
      <tr>
        <td style="padding:24px 36px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" valign="top" style="background:#f8f9ff;border:1px solid #e8edf5;border-radius:12px;padding:16px;">
                <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">👤 Customer</div>
                <div style="font-size:15px;font-weight:700;color:#1a1a2e;">${orderData.customerFirstName} ${orderData.customerLastName}</div>
                <div style="font-size:13px;color:#1a56db;margin-top:4px;">${orderData.customerEmail}</div>
              </td>
              <td width="4%"></td>
              <td width="48%" valign="top" style="background:#f8f9ff;border:1px solid #e8edf5;border-radius:12px;padding:16px;">
                <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">💳 Payment</div>
                <div style="font-size:15px;font-weight:700;color:#1a1a2e;text-transform:capitalize;">${paymentLabel}</div>
                ${isCOD ? '<div style="font-size:12px;color:#b45309;margin-top:4px;font-weight:600;">⚠️ Collect cash on delivery</div>' : '<div style="font-size:12px;color:#15803d;margin-top:4px;font-weight:600;">✅ Payment received</div>'}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Items -->
      <tr>
        <td style="padding:20px 36px 0;">
          <h3 style="margin:0 0 12px;font-size:15px;font-weight:800;color:#1a1a2e;">Order Items</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #f0f0f0;border-radius:10px;overflow:hidden;">
            <thead>
              <tr style="background:#f8f9ff;">
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;">Product</th>
                <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;">Qty</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
        </td>
      </tr>

      <!-- Totals -->
      <tr>
        <td style="padding:12px 36px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;border:1px solid #e8edf5;border-radius:10px;overflow:hidden;">
            <tr><td style="padding:10px 16px;font-size:13px;color:#555;">Subtotal</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1a1a2e;text-align:right;">$${orderData.itemsPrice.toFixed(2)}</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;color:#555;">Shipping</td><td style="padding:10px 16px;font-size:13px;font-weight:600;text-align:right;">${orderData.shippingPrice === 0 ? '<span style="color:#22c55e;">FREE</span>' : `$${orderData.shippingPrice.toFixed(2)}`}</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;color:#555;">Tax</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1a1a2e;text-align:right;">$${orderData.taxPrice.toFixed(2)}</td></tr>
            <tr style="border-top:2px solid #e8edf5;"><td style="padding:14px 16px;font-size:17px;font-weight:800;color:#1a1a2e;">Total</td><td style="padding:14px 16px;font-size:20px;font-weight:900;color:#1a56db;text-align:right;">$${orderData.totalPrice.toFixed(2)}</td></tr>
          </table>
        </td>
      </tr>

      <!-- Ship to -->
      <tr>
        <td style="padding:12px 36px 0;">
          <div style="background:#f8f9ff;border:1px solid #e8edf5;border-radius:10px;padding:16px;">
            <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">📦 Ship To</div>
            <div style="font-size:14px;color:#1a1a2e;line-height:1.7;">
              ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}<br>
              ${orderData.shippingAddress.street}<br>
              ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}, ${orderData.shippingAddress.country}
            </div>
          </div>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding:24px 36px 32px;text-align:center;">
          <a href="${adminOrderUrl}" style="display:inline-block;background:linear-gradient(135deg,#1a56db 0%,#0e3fa5 100%);color:#fff;font-size:15px;font-weight:800;padding:14px 36px;border-radius:50px;text-decoration:none;letter-spacing:0.3px;">
            View in Admin Dashboard →
          </a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8f9ff;padding:16px 36px;text-align:center;border-top:1px solid #e8edf5;">
          <p style="margin:0;font-size:12px;color:#aaa;">Petshiwu Admin Notification · support@petshiwu.com</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

    await resendClient.emails.send({
      from: 'Petshiwu Orders <orders@petshiwu.com>',
      to: adminEmail,
      subject: `🛍️ New Order #${orderData.orderNumber} — $${orderData.totalPrice.toFixed(2)} (${orderData.customerFirstName} ${orderData.customerLastName})`,
      html
    });

    logger.info(`✅ Admin order notification sent for ${orderData.orderNumber}`);
  } catch (error: any) {
    // Never throw — admin email failure must not affect order creation
    logger.error(`❌ Failed to send admin order notification for ${orderData.orderNumber}:`, error.message);
  }
};

export const sendCartAbandonmentEmail = async (
  email: string,
  firstName: string,
  cartItems: Array<{ name: string; image?: string; quantity: number; price: number }>,
  cartUrl: string
) => {
  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'https://petshiwu.com';

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const mailOptions = {
      from: `"Petshiwu" <${process.env.SMTP_USER || 'noreply@petshiwu.com'}>`,
      to: email,
      subject: 'Complete Your Purchase - Your Cart is Waiting! 🛒',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Your Purchase</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🛒 Your Cart is Waiting!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${firstName},</p>
            <p>We noticed you left some items in your cart. Don't miss out on these great products!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Your Cart Items:</h2>
              ${cartItems.map(item => `
                <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #eee;">
                  ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">` : ''}
                  <div style="flex: 1;">
                    <p style="margin: 0; font-weight: bold;">${item.name}</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Quantity: ${item.quantity} × $${item.price.toFixed(2)}</p>
                  </div>
                  <div style="font-weight: bold; color: #667eea;">$${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              `).join('')}
              <div style="padding: 15px; border-top: 2px solid #667eea; margin-top: 15px;">
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                  <span>Total:</span>
                  <span style="color: #667eea;">$${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${cartUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Complete Your Purchase →
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will remain active for 7 days. If you have any questions, feel free to contact us!
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Best regards,<br>
              The Petshiwu Team
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Complete Your Purchase
        
        Hi ${firstName},
        
        We noticed you left some items in your cart. Don't miss out on these great products!
        
        Your Cart Items:
        ${cartItems.map(item => `- ${item.name} (${item.quantity} × $${item.price.toFixed(2)}) = $${(item.price * item.quantity).toFixed(2)}`).join('\n')}
        
        Total: $${total.toFixed(2)}
        
        Complete your purchase here: ${cartUrl}
        
        This link will remain active for 7 days.
        
        Best regards,
        The Petshiwu Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Cart abandonment email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error: any) {
    logger.error(`❌ Error sending cart abandonment email to ${email}:`, error.message);
    throw error;
  }
};
// ─────────────────────────────────────────────────────────────
// WELCOME EMAIL
// ─────────────────────────────────────────────────────────────
export const sendWelcomeEmail = async (email: string, firstName: string): Promise<any> => {
  const siteUrl = getFrontendBaseUrl();
  const subject = `Welcome to Petshiwu, ${firstName}! 🎉`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}
  .wrapper{max-width:600px;margin:0 auto;background:#0d1424;border-radius:20px;overflow:hidden;border:1px solid rgba(99,179,237,0.15)}
  .header{position:relative;background:linear-gradient(135deg,#0d1424 0%,#0f1f3d 100%);padding:40px 40px 28px;text-align:center;overflow:hidden}
  .header::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#3b82f6,#8b5cf6,#06b6d4,transparent)}
  .grid-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px);background-size:32px 32px;pointer-events:none}
  .dot-glow{position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:300px;height:200px;background:radial-gradient(ellipse,rgba(59,130,246,0.25) 0%,transparent 70%);pointer-events:none}
  .logo{font-size:32px;font-weight:900;letter-spacing:-1px;color:#60a5fa;position:relative;z-index:1}
  .logo-sub{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(148,163,184,0.55);margin-top:4px;font-weight:600;position:relative;z-index:1}
  .header-paws{margin-top:18px;font-size:18px;opacity:0.3;letter-spacing:10px;position:relative;z-index:1}
  .hero{position:relative;background:linear-gradient(160deg,#0f1f3d 0%,#131d36 50%,#160d2e 100%);padding:44px 40px 48px;text-align:center;overflow:hidden}
  .hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.4),rgba(59,130,246,0.4),transparent)}
  .orb1{position:absolute;top:-40px;right:-30px;width:200px;height:200px;background:radial-gradient(circle,rgba(139,92,246,0.18) 0%,transparent 70%)}
  .orb2{position:absolute;bottom:-40px;left:-30px;width:180px;height:180px;background:radial-gradient(circle,rgba(6,182,212,0.14) 0%,transparent 70%)}
  .badge{display:inline-flex;align-items:center;gap:6px;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.3);color:#60a5fa;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 14px;border-radius:50px;margin-bottom:20px}
  .badge-dot{width:6px;height:6px;border-radius:50%;background:#3b82f6;display:inline-block}
  .hero-emoji{font-size:52px;display:block;margin-bottom:14px;position:relative;z-index:1}
  .hero-title{font-size:28px;font-weight:900;color:#f1f5f9;line-height:1.2;margin-bottom:8px;position:relative;z-index:1}
  .grad{color:#a78bfa}
  .hero-sub{color:rgba(148,163,184,0.8);font-size:14px;line-height:1.7;max-width:400px;margin:12px auto 28px;position:relative;z-index:1}
  .btn{display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff!important;font-weight:800;font-size:14px;padding:14px 36px;border-radius:50px;text-decoration:none;position:relative;z-index:1}
  .greeting{padding:32px 40px 8px}
  .greeting h2{font-size:19px;font-weight:700;color:#e2e8f0;margin-bottom:8px}
  .greeting p{color:#64748b;font-size:14px;line-height:1.7}
  .stats{display:table;width:calc(100% - 80px);margin:24px 40px;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);border-collapse:collapse}
  .stat{display:table-cell;width:33.3%;padding:18px 12px;text-align:center;background:rgba(255,255,255,0.02);border-right:1px solid rgba(255,255,255,0.06)}
  .stat:last-child{border-right:none}
  .stat-val{font-size:20px;font-weight:900;color:#60a5fa}
  .stat-label{font-size:10px;color:#475569;margin-top:3px;font-weight:600}
  .section{padding:8px 40px 24px}
  .section-label{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(99,179,237,0.5);margin-bottom:16px}
  .perk-grid{display:table;width:100%;border-collapse:separate;border-spacing:10px}
  .perk-row{display:table-row}
  .perk{display:inline-block;width:48%;vertical-align:top;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px 14px;margin:5px}
  .perk-icon{font-size:22px;margin-bottom:8px}
  .perk-title{font-size:13px;font-weight:700;color:#cbd5e1;margin-bottom:3px}
  .perk-desc{font-size:11px;color:#475569;line-height:1.5}
  .pills{display:block;padding:0 40px 28px}
  .pills-label{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(99,179,237,0.5);margin-bottom:14px}
  .pill{display:inline-block;background:rgba(59,130,246,0.07);border:1px solid rgba(59,130,246,0.2);color:#60a5fa!important;border-radius:50px;padding:6px 14px;font-size:12px;font-weight:600;text-decoration:none;margin:3px}
  .offer-wrap{padding:0 40px 32px}
  .offer{background:linear-gradient(135deg,rgba(30,64,175,0.6) 0%,rgba(109,40,217,0.6) 100%);border:1px solid rgba(139,92,246,0.3);border-radius:16px;padding:28px;text-align:center}
  .offer::before{content:'';display:block;height:1px;background:linear-gradient(90deg,transparent,rgba(167,139,250,0.6),transparent);margin-bottom:20px;margin-top:-8px}
  .offer-badge{display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#c4b5fd;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:3px 12px;border-radius:50px;margin-bottom:12px}
  .offer-title{font-size:19px;font-weight:800;color:#f1f5f9;margin-bottom:6px}
  .offer-desc{color:rgba(196,181,253,0.7);font-size:12px;margin-bottom:18px}
  .btn-offer{display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#f1f5f9!important;font-weight:700;font-size:13px;padding:10px 26px;border-radius:50px;text-decoration:none}
  .footer{background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.06);padding:24px 40px;text-align:center}
  .footer-links{margin-bottom:10px}
  .footer-links a{color:#475569!important;font-size:11px;text-decoration:none;margin:0 8px}
  .footer-copy{color:#2d3748;font-size:10px;line-height:1.8}
  .footer-copy a{color:#3d4f6b!important}
</style>
</head>
<body>
<div class="wrapper">

  <div class="header">
    <div class="grid-bg"></div>
    <div class="dot-glow"></div>
    <div class="logo">Petshiwu</div>
    <div class="logo-sub">Premium Pet Care Platform</div>
    <div class="header-paws">🐾 &nbsp; 🐾 &nbsp; 🐾</div>
  </div>

  <div class="hero">
    <div class="orb1"></div>
    <div class="orb2"></div>
    <div class="badge"><span class="badge-dot"></span> Account Activated</div>
    <span class="hero-emoji">🎉</span>
    <div class="hero-title">Welcome to the<br><span class="grad">Petshiwu Family</span></div>
    <div class="hero-sub">Your account is live. Thousands of premium pet products — delivered fast to your door across the USA.</div>
    <a href="${siteUrl}/products" class="btn">🛍️ &nbsp;Start Shopping Now</a>
  </div>

  <div class="greeting">
    <h2>Hey ${firstName}! 👋</h2>
    <p>We're thrilled to have you. Whether you're here for your dog, cat, bird, reptile, or something a little more exotic — Petshiwu has you covered with premium products at great prices.</p>
  </div>

  <table class="stats">
    <tr>
      <td class="stat"><div class="stat-val">10K+</div><div class="stat-label">Products</div></td>
      <td class="stat"><div class="stat-val">50+</div><div class="stat-label">Top Brands</div></td>
      <td class="stat"><div class="stat-val">2-5d</div><div class="stat-label">Delivery</div></td>
    </tr>
  </table>

  <div class="section">
    <div class="section-label">Why pet parents choose us</div>
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td width="50%" style="padding:5px">
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px 14px">
            <div style="font-size:22px;margin-bottom:8px">🚚</div>
            <div style="font-size:13px;font-weight:700;color:#cbd5e1;margin-bottom:3px">Free Shipping</div>
            <div style="font-size:11px;color:#475569;line-height:1.5">On all orders over $49. Fast delivery nationwide.</div>
          </div>
        </td>
        <td width="50%" style="padding:5px">
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px 14px">
            <div style="font-size:22px;margin-bottom:8px">⭐</div>
            <div style="font-size:13px;font-weight:700;color:#cbd5e1;margin-bottom:3px">Premium Brands</div>
            <div style="font-size:11px;color:#475569;line-height:1.5">Royal Canin, Wellness, Hill's, Purina &amp; 50+ more.</div>
          </div>
        </td>
      </tr>
      <tr>
        <td width="50%" style="padding:5px">
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px 14px">
            <div style="font-size:22px;margin-bottom:8px">🤖</div>
            <div style="font-size:13px;font-weight:700;color:#cbd5e1;margin-bottom:3px">AI Pet Advisor</div>
            <div style="font-size:11px;color:#475569;line-height:1.5">Smart picks tailored to your specific pet.</div>
          </div>
        </td>
        <td width="50%" style="padding:5px">
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px 14px">
            <div style="font-size:22px;margin-bottom:8px">🔒</div>
            <div style="font-size:13px;font-weight:700;color:#cbd5e1;margin-bottom:3px">Secure Checkout</div>
            <div style="font-size:11px;color:#475569;line-height:1.5">100% safe payments. Easy hassle-free returns.</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <div class="pills">
    <div class="pills-label">Shop by pet type</div>
    <a href="${siteUrl}/dog" class="pill">🐕 Dogs</a>
    <a href="${siteUrl}/cat" class="pill">🐱 Cats</a>
    <a href="${siteUrl}/bird" class="pill">🐦 Birds</a>
    <a href="${siteUrl}/fish" class="pill">🐟 Fish</a>
    <a href="${siteUrl}/reptile" class="pill">🦎 Reptiles</a>
    <a href="${siteUrl}/small-pet" class="pill">🐹 Small Pets</a>
  </div>

  <div class="offer-wrap">
    <div class="offer">
      <div class="offer-badge">🎁 Welcome Gift</div>
      <div class="offer-title">Free shipping on your first order</div>
      <div class="offer-desc">No minimum. No code needed. Just for you.</div>
      <a href="${siteUrl}/products" class="btn-offer">Claim Now →</a>
    </div>
  </div>

  <div class="footer">
    <div class="footer-links">
      <a href="${siteUrl}/about">About</a>
      <a href="${siteUrl}/faq">FAQ</a>
      <a href="${siteUrl}/contact">Contact</a>
      <a href="${siteUrl}/privacy">Privacy</a>
    </div>
    <div class="footer-copy">
      © ${new Date().getFullYear()} Petshiwu · Jackson Heights, Queens, NY · support@petshiwu.com<br>
      You received this because you created an account at petshiwu.com.<br>
      <a href="${siteUrl}/unsubscribe">Unsubscribe</a>
    </div>
  </div>

</div>
</body>
</html>`;

  const text = `Welcome to Petshiwu, ${firstName}!

Your account is live. Start shopping thousands of premium pet products at ${siteUrl}/products

Why pet parents love us:
- Free shipping on orders over $49
- 50+ premium brands (Royal Canin, Wellness, Hill's, Purina & more)
- AI Pet Advisor for personalized picks
- 100% secure checkout

Shop by pet: Dogs · Cats · Birds · Fish · Reptiles · Small Pets

Welcome gift: Free shipping on your first order — no code needed.

© ${new Date().getFullYear()} Petshiwu · support@petshiwu.com
`;

  try {
    if (resendClient) {
      const result = await resendClient.emails.send({
        from: process.env.EMAIL_FROM || 'Petshiwu <noreply@petshiwu.com>',
        to: email,
        subject,
        html,
        text
      });
      logger.info(`✅ Welcome email sent to ${email} via Resend`);
      return result;
    }

    const transporter = createTransporter();
    if (!transporter) throw new Error('No email transport configured');

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Petshiwu" <noreply@petshiwu.com>',
      to: email,
      subject,
      html,
      text
    });
    logger.info(`✅ Welcome email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error: any) {
    logger.error(`❌ Error sending welcome email to ${email}:`, error.message);
    throw error;
  }
};

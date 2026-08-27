import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import logger from './logger';
import EmailTemplate from '../models/EmailTemplate';
import { buildOrderConfirmationEmail } from './orderConfirmationEmail';

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

/** BrowserRouter path — never HashRouter `/#/reset-password`. */
export const buildPasswordResetUrl = (token: string): string =>
  `${getFrontendBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

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

const isSmtpConfigured = (): boolean =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const isEmailProviderConfigured = (): boolean => Boolean(resendClient) || isSmtpConfigured();

const htmlToText = (html: string): string =>
  html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

async function sendHtmlEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ messageId: string; accepted: string[] } | null> {
  const from = process.env.SMTP_FROM || process.env.RESEND_FROM || 'Petshiwu <noreply@petshiwu.com>';
  const text = options.text || htmlToText(options.html);

  if (resendClient) {
    const result = await resendClient.emails.send({
      from,
      to: options.to,
      replyTo: 'support@petshiwu.com',
      subject: options.subject,
      html: options.html,
      text
    });
    if (!result.error) {
      return { messageId: result.data?.id || 'resend', accepted: [options.to] };
    }
    logger.warn(`Resend failed for ${options.to}: ${result.error.message}`);
  }

  if (isSmtpConfigured()) {
    const info = await createTransporter().sendMail({
      from,
      to: options.to,
      replyTo: 'support@petshiwu.com',
      subject: options.subject,
      html: options.html,
      text
    });
    return { messageId: info.messageId || 'smtp', accepted: [options.to] };
  }

  logger.warn(`No email provider configured. Skipping email to ${options.to}.`);
  return { messageId: 'no-provider', accepted: [options.to] };
}

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
    const { subject, html, text } = buildOrderConfirmationEmail(
      firstName,
      orderNumber,
      { ...orderData, customerEmail: email },
      frontendUrl
    );

    // ── Send via Resend (preferred) or SMTP fallback ─────────
    if (resendClient) {
      const result = await resendClient.emails.send({
        from: 'Petshiwu <noreply@petshiwu.com>',
        to: email,
        replyTo: 'support@petshiwu.com',
        subject,
        html,
        text,
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
      from: process.env.SMTP_FROM || 'Petshiwu <noreply@petshiwu.com>',
      replyTo: 'support@petshiwu.com',
      to: email,
      subject,
      html,
      text,
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
    if (!isEmailProviderConfigured()) {
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

    const info = await sendHtmlEmail({
      to: email,
      subject,
      html: body,
      text: htmlToText(body)
    });
    logger.info(`✅ Order cancellation email sent to ${email} for order #${orderNumber}: ${info?.messageId}`);
    return info;
  } catch (error: any) {
    logger.error(`❌ Error sending order cancellation email to ${email}:`, error.message);
    return null;
  }
};

export const buildReorderReminderEmail = (
  firstName: string,
  orderNumber: string,
  reminder: {
    weeks: number;
    items: Array<{ name: string; quantity: number }>;
    buyAgainUrlPath?: string;
    mode?: 'ask' | 'autoship';
  }
): { subject: string; html: string } => {
  const mode = reminder.mode === 'autoship' ? 'autoship' : 'ask';
  const buyAgainUrl = `${getFrontendBaseUrl()}${
    reminder.buyAgainUrlPath || (mode === 'ask' ? '/restock?coupon=RESTOCK5' : '/restock?coupon=RESTOCK7&mode=autoship')
  }`;
  const itemLines = (reminder.items || [])
    .slice(0, 8)
    .map((item) => `<li>${item.quantity} × ${item.name}</li>`)
    .join('');
  const safeName = firstName || 'there';

  if (mode === 'autoship') {
    return {
      subject: `Your Petshiwu autoship is due — 7% off or skip #${orderNumber}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your autoship is due</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1E3A8A; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">Autoship is due</h1>
          <p style="margin: 10px 0 0 0;">Order #${orderNumber}</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <p>Hi ${safeName},</p>
          <p>Your usual is on schedule. Tap <strong>Ship now</strong> to pay and we'll pack it. Autoship is the better price: <strong>7% off (max $10)</strong>.</p>
          ${itemLines ? `<ul>${itemLines}</ul>` : ''}
          <p style="background:#ecfdf5;border-left:4px solid #059669;padding:12px 16px;">
            <strong>We will not charge your card unless you tap Ship now and pay.</strong> Ignore this email and we skip this cycle.
          </p>
          <p style="text-align:center;margin:28px 0;">
            <a href="${buyAgainUrl}" style="background:#1E3A8A;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;">Ship now — 7% off (max $10)</a>
          </p>
          <p style="color:#666;font-size:12px;">Not a silent charge. Ask first is 5% off if you'd rather confirm each time. Add or remove items in your restock cart on the dashboard.</p>
        </div>
      </body>
      </html>
    `,
    };
  }

  return {
    subject: `Confirm now for 5% off (max $10) — restock #${orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm now — 5% off your restock</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1E3A8A; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">Confirm now. Get 5% off.</h1>
          <p style="margin: 10px 0 0 0;">Max $10 · Order #${orderNumber}</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <p>Hi ${safeName},</p>
          <p>Your usual is ready. Confirm now and we take <strong>5% off (max $10)</strong> at checkout. Autoship is 7% off if you'd rather we ping you on a schedule.</p>
          ${itemLines ? `<ul>${itemLines}</ul>` : ''}
          <p style="background:#ecfdf5;border-left:4px solid #059669;padding:12px 16px;">
            <strong>We will not charge your card unless you tap Confirm now and pay.</strong> Ignore this email and nothing ships.
          </p>
          <p style="text-align:center;margin:28px 0;">
            <a href="${buyAgainUrl}" style="background:#1E3A8A;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;">Confirm now — 5% off (max $10)</a>
          </p>
          <p style="color:#666;font-size:12px;">Add or remove items in your restock cart any time. Toys skip restock — add what they actually run out of.</p>
        </div>
      </body>
      </html>
    `,
  };
};

export const sendReorderReminderEmail = async (
  email: string,
  firstName: string,
  orderNumber: string,
  reminder: {
    weeks: number;
    items: Array<{ name: string; quantity: number }>;
    buyAgainUrlPath?: string;
    mode?: 'ask' | 'autoship';
  }
) => {
  try {
    const { subject, html } = buildReorderReminderEmail(firstName, orderNumber, reminder);

    const info = await sendHtmlEmail({
      to: email,
      subject,
      html,
    });
    logger.info(`✅ Reorder reminder emailed to ${email} for #${orderNumber}: ${info?.messageId}`);
    return info;
  } catch (error: any) {
    logger.error(`❌ Error sending reorder reminder to ${email}:`, error.message);
    throw error;
  }
};

const ORDER_STATUS_COPY: Record<string, { title: string; intro: string; headerColor: string }> = {
  pending: {
    title: 'Order Pending',
    intro: 'Your order is pending. We will start preparing it shortly.',
    headerColor: '#64748b'
  },
  processing: {
    title: 'We Are Preparing Your Order',
    intro: "Great news — we're preparing your Petshiwu order now.",
    headerColor: '#d97706'
  },
  shipped: {
    title: 'Your Order Is On The Way',
    intro: 'Your order is on the way to you.',
    headerColor: '#2563eb'
  },
  delivered: {
    title: 'Order Delivered',
    intro: 'Your order has been delivered.',
    headerColor: '#16a34a'
  },
  cancelled: {
    title: 'Order Cancelled',
    intro: 'Your order has been cancelled.',
    headerColor: '#dc2626'
  }
};

export const sendOrderStatusEmail = async (
  email: string,
  firstName: string,
  orderNumber: string,
  orderData: {
    status: string;
    trackingNumber?: string | null;
    totalPrice: number;
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
    if (!isEmailProviderConfigured()) {
      logger.warn(`⚠️  Email not configured. Skipping order status email to ${email} for #${orderNumber}.`);
      return { messageId: 'test-mode', accepted: [email] };
    }

    const copy = ORDER_STATUS_COPY[orderData.status] || {
      title: 'Order Update',
      intro: `Your order status is now ${orderData.status}.`,
      headerColor: '#166534'
    };
    const statusLabel = orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1);
    const address = `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}, ${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}`;

    const defaultSubject = `${copy.title} #${orderNumber} - Petshiwu`;
    const defaultBody = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: ${copy.headerColor}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">{{title}}</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Order #{{orderNumber}}</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <p>Hi {{firstName}},</p>
          <p>{{intro}}</p>
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Order Number:</strong> {{orderNumber}}</p>
            <p><strong>Status:</strong> {{statusLabel}}</p>
            {{#if trackingNumber}}
            <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
            {{/if}}
            <p><strong>Total:</strong> $${'{{totalPrice}}'}</p>
            <p><strong>Delivery Address:</strong><br>{{shippingAddress}}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Best regards,<br>
            The Petshiwu Team
          </p>
        </div>
      </body>
      </html>
    `;

    const template = await getEmailTemplate(`order_status_${orderData.status}`, defaultSubject, defaultBody);
    const variables = {
      firstName: firstName || 'Customer',
      orderNumber,
      title: copy.title,
      intro: copy.intro,
      statusLabel,
      trackingNumber: orderData.trackingNumber || '',
      totalPrice: orderData.totalPrice.toFixed(2),
      shippingAddress: address
    };

    let subject = replaceTemplateVariables(template.subject, variables);
    let body = replaceTemplateVariables(template.body, variables);
    if (orderData.trackingNumber) {
      body = body.replace(/{{#if trackingNumber}}([\s\S]*?){{\/if}}/g, '$1');
    } else {
      body = body.replace(/{{#if trackingNumber}}[\s\S]*?{{\/if}}/g, '');
    }

    const info = await sendHtmlEmail({ to: email, subject, html: body, text: htmlToText(body) });
    logger.info(`✅ Order status email (${orderData.status}) sent to ${email} for #${orderNumber}: ${info?.messageId}`);
    return info;
  } catch (error: any) {
    logger.error(`❌ Error sending order status email to ${email}:`, error.message);
    return null;
  }
};

export const sendDeliveryProofEmail = async (
  email: string,
  firstName: string,
  orderNumber: string,
  deliveryData: {
    deliveredAt: Date;
    handoffMethod: string;
    recipientName?: string;
    notes?: string;
    photoData: Buffer;
    mimeType: string;
  }
): Promise<{ messageId: string }> => {
  const escapeHtml = (value: string): string => value.replace(/[&<>\"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;',
    "'": '&#39;'
  }[character] || character));

  const safeFirstName = escapeHtml(firstName || 'Customer');
  const safeOrderNumber = escapeHtml(orderNumber);
  const safeHandoff = escapeHtml(deliveryData.handoffMethod.replace(/_/g, ' '));
  const safeRecipient = deliveryData.recipientName ? escapeHtml(deliveryData.recipientName) : '';
  const safeNotes = deliveryData.notes ? escapeHtml(deliveryData.notes) : '';
  const attachmentExtension = deliveryData.mimeType === 'image/png' ? 'png' : deliveryData.mimeType === 'image/webp' ? 'webp' : 'jpg';
  const html = `
    <!DOCTYPE html>
    <html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#243b53;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#166534;color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="margin:0 0 8px;">Your Petshiwu order was delivered</h1>
        <p style="margin:0;font-size:18px;">Order #${safeOrderNumber}</p>
      </div>
      <div style="background:#f8fafc;padding:28px;border-radius:0 0 12px 12px;">
        <p>Hi ${safeFirstName},</p>
        <p>Your order has been delivered. We attached the delivery photo so you can confirm where it was left or who received it.</p>
        <div style="background:white;border:1px solid #dbeafe;border-radius:10px;padding:18px;margin:20px 0;">
          <p style="margin:0 0 8px;"><strong>Delivered:</strong> ${new Date(deliveryData.deliveredAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
          <p style="margin:0 0 8px;"><strong>Handoff:</strong> ${safeHandoff}</p>
          ${safeRecipient ? `<p style="margin:0 0 8px;"><strong>Received by:</strong> ${safeRecipient}</p>` : ''}
          ${safeNotes ? `<p style="margin:0;"><strong>Driver note:</strong> ${safeNotes}</p>` : ''}
        </div>
        <p>If anything looks wrong, reply to this email or contact Petshiwu support.</p>
        <p style="color:#64748b;font-size:13px;margin-top:28px;">The Petshiwu Team · Jackson Heights, Queens</p>
      </div>
    </body></html>`;
  const text = `Hi ${firstName || 'Customer'},\n\nYour Petshiwu order #${orderNumber} was delivered. The delivery photo is attached.\n\nHandoff: ${deliveryData.handoffMethod.replace(/_/g, ' ')}${deliveryData.recipientName ? `\nReceived by: ${deliveryData.recipientName}` : ''}${deliveryData.notes ? `\nDriver note: ${deliveryData.notes}` : ''}\n\nThe Petshiwu Team`;
  const attachment = {
    filename: `petshiwu-delivery-proof-${orderNumber}.${attachmentExtension}`,
    content: deliveryData.photoData,
    contentType: deliveryData.mimeType
  };
  const from = process.env.SMTP_FROM || process.env.RESEND_FROM || 'Petshiwu Orders <noreply@petshiwu.com>';

  if (resendClient) {
    const result = await resendClient.emails.send(
      { from, to: email, subject: `Your Petshiwu order was delivered – #${orderNumber}`, html, text, attachments: [attachment] },
      { idempotencyKey: `delivery-proof-${orderNumber}` }
    );
    if (result.error || !result.data?.id) throw new Error(result.error?.message || 'Delivery email provider returned no message ID');
    logger.info(`Delivery proof email sent for order #${orderNumber}: ${result.data.id}`);
    return { messageId: result.data.id };
  }

  if (!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) {
    throw new Error('No email provider configured');
  }
  const info = await createTransporter().sendMail({ from, to: email, subject: `Your Petshiwu order was delivered – #${orderNumber}`, html, text, attachments: [attachment] });
  logger.info(`Delivery proof email sent for order #${orderNumber}: ${info.messageId}`);
  return { messageId: info.messageId || 'smtp-sent' };
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
    attachment?: {
      filename: string;
      content: Buffer;
      contentType: string;
    };
    idempotencyKey?: string;
  }
) => {
  try {
    if (!isEmailProviderConfigured()) {
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

    const info = await sendHtmlEmail({
      to: email,
      subject,
      html: body,
      text: htmlToText(body)
    });
    logger.info(`✅ Order delivered email sent to ${email} for order #${orderNumber}: ${info?.messageId}`);
    return info;
  } catch (error: any) {
    logger.error(`❌ Error sending order delivered email to ${email}:`, error.message);
    return null;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, token: string, firstName: string) => {
  try {
    const resetUrl = buildPasswordResetUrl(token);
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
  items: Array<{ name: string; quantity: number; price: number; image?: string }>;
  totalPrice: number;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  donationAmount?: number;
  paymentMethod: string;
  createdAt?: Date | string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
}): Promise<void> => {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'admin@petshiwu.com';
  try {
    if (!resendClient) {
      logger.warn('⚠️  Resend not configured — skipping admin order notification');
      return;
    }

    const frontendUrl = getFrontendBaseUrl();
    const packingSlip = buildOrderConfirmationEmail(
      orderData.customerFirstName,
      orderData.orderNumber,
      {
        orderId: orderData.orderId,
        items: orderData.items,
        totalPrice: orderData.totalPrice,
        itemsPrice: orderData.itemsPrice,
        shippingPrice: orderData.shippingPrice,
        taxPrice: orderData.taxPrice,
        donationAmount: orderData.donationAmount,
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
        createdAt: orderData.createdAt || new Date(),
        customerEmail: orderData.customerEmail,
      },
      frontendUrl
    );

    await resendClient.emails.send({
      from: 'Petshiwu Orders <orders@petshiwu.com>',
      to: adminEmail,
      subject: `Packing slip ${orderData.orderNumber} — $${Number(orderData.totalPrice).toFixed(2)} (${orderData.customerFirstName} ${orderData.customerLastName})`,
      html: packingSlip.html,
      text: packingSlip.text,
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

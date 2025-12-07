import nodemailer from 'nodemailer';
import logger from './logger';
import EmailTemplate from '../models/EmailTemplate';

// Create reusable transporter
const createTransporter = () => {
  // If SMTP is configured, use it (works with GoDaddy, custom SMTP servers, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
      logger.info(`📧 Verification link for ${email}: ${verificationUrl}`);
      return { messageId: 'test-mode', accepted: [email] };
    }

    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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
    // Check if email is actually configured
    const isEmailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    
    if (!isEmailConfigured) {
      logger.warn(`⚠️  Email not configured. Skipping order confirmation email to ${email}.`);
      logger.warn(`⚠️  Order #${orderNumber} created successfully, but confirmation email not sent.`);
      return { messageId: 'test-mode', accepted: [email] };
    }

    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const orderUrl = `${frontendUrl}/orders/${orderData.createdAt}`;

    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 10px; vertical-align: middle;">` : ''}
          <span style="vertical-align: middle;">${item.name}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    // Get template from database or use default
    const defaultSubject = `Order Confirmation #${orderNumber} - Petshiwu`;
    const defaultBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">Order Confirmed!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Order #{{orderNumber}}</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
          <p>Hi {{firstName}},</p>
          <p>Thank you for your order! We've received your order and will begin processing it shortly.</p>
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #333;">Order Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Subtotal:</span>
                <span>$${orderData.itemsPrice.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Shipping:</span>
                <span>$${orderData.shippingPrice.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Tax:</span>
                <span>$${orderData.taxPrice.toFixed(2)}</span>
              </div>
              ${orderData.donationAmount && orderData.donationAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #4CAF50;">
                <span>Donation:</span>
                <span>$${orderData.donationAmount.toFixed(2)}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; padding-top: 10px; border-top: 2px solid #ddd; margin-top: 10px;">
                <span>Total:</span>
                <span>$${orderData.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Shipping Address</h3>
            <p style="margin: 5px 0;">
              ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}<br>
              ${orderData.shippingAddress.street}<br>
              ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}<br>
              ${orderData.shippingAddress.country}
            </p>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Payment Method</h3>
            <p style="margin: 5px 0; text-transform: capitalize;">
              ${orderData.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : orderData.paymentMethod.replace('_', ' ')}
            </p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">
              ${orderData.paymentMethod === 'cod' ? 'Payment will be collected upon delivery.' : 'Payment processed successfully.'}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${orderUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Order Details
            </a>
          </div>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            We'll send you another email when your order ships. If you have any questions, please contact our customer service.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Best regards,<br>
            The Petshiwu Team
          </p>
        </div>
      </body>
      </html>
    `;

    const template = await getEmailTemplate('order_confirmation', defaultSubject, defaultBody);
    
    const variables = {
      firstName,
      orderNumber
    };

    let subject = replaceTemplateVariables(template.subject, variables);
    let body = replaceTemplateVariables(template.body, variables);
    
    // If template doesn't have placeholders, use the full HTML we built
    if (!template.body.includes('{{orderNumber}}')) {
      subject = defaultSubject;
      body = defaultBody.replace('{{orderNumber}}', orderNumber).replace('{{firstName}}', firstName);
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@petshiwu.com',
      to: email,
      subject,
      html: body,
      text: body.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n\n')
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Order confirmation email sent to ${email} for order #${orderNumber}: ${info.messageId}`);
    return info;
  } catch (error: any) {
    logger.error(`❌ Error sending order confirmation email to ${email}:`, error.message);
    // Don't throw error - order was created successfully, email failure shouldn't break the flow
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
            <a href="{{frontendUrl}}/orders/{{orderId}}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin-top: 10px;">
              Leave a Review
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
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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
    // Check if email is actually configured
    const isEmailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    
    if (!isEmailConfigured) {
      logger.warn(`⚠️  Email not configured. Skipping password reset email to ${email}.`);
      logger.warn(`⚠️  In development, you can use the reset link below.`);
      // In development/test mode, log the reset link instead
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
      logger.info(`📧 Password reset link for ${email}: ${resetUrl}`);
      return { messageId: 'test-mode', accepted: [email] };
    }

    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
      logger.warn(`📧 Fallback password reset link for ${email}: ${resetUrl}`);
    }
    throw error;
  }
};

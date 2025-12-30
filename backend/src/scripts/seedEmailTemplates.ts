import mongoose from 'mongoose';
import EmailTemplate from '../models/EmailTemplate';
import { connectDatabase } from '../utils/database';
import logger from '../utils/logger';

const defaultTemplates = [
  {
    name: 'order_confirmation',
    subject: 'Order Confirmation #{{orderNumber}} - Petshiwu',
    body: `
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
    `,
    variables: ['firstName', 'orderNumber'],
    isActive: true
  },
  {
    name: 'order_cancellation',
    subject: 'Order Cancelled #{{orderNumber}} - Petshiwu',
    body: `
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
    `,
    variables: ['firstName', 'orderNumber', 'orderDate', 'totalPrice', 'refundAmount'],
    isActive: true
  },
  {
    name: 'order_delivered',
    subject: 'Order Delivered #{{orderNumber}} - Petshiwu',
    body: `
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
    `,
    variables: ['firstName', 'orderNumber', 'deliveredDate', 'trackingNumber', 'shippingAddress', 'frontendUrl', 'orderId'],
    isActive: true
  }
];

export const seedEmailTemplates = async () => {
  try {
    await connectDatabase();
    logger.info('Seeding email templates...');

    for (const templateData of defaultTemplates) {
      const existingTemplate = await EmailTemplate.findOne({ name: templateData.name });
      
      if (existingTemplate) {
        // Update existing template
        existingTemplate.subject = templateData.subject;
        existingTemplate.body = templateData.body;
        existingTemplate.variables = templateData.variables;
        existingTemplate.isActive = templateData.isActive;
        await existingTemplate.save();
        logger.info(`✓ Updated template: ${templateData.name}`);
      } else {
        // Create new template
        await EmailTemplate.create(templateData);
        logger.info(`✓ Created template: ${templateData.name}`);
      }
    }

    logger.info('✅ Email templates seeded successfully');
  } catch (error: any) {
    logger.error('❌ Error seeding email templates:', error.message);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  seedEmailTemplates()
    .then(() => {
      logger.info('Email templates seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Email templates seeding failed:', error);
      process.exit(1);
    });
}


import { Request, Response, NextFunction } from 'express';
import StockAlert from '../models/StockAlert';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { sendVerificationEmail } from '../utils/emailService';

// Create stock alert
export const createStockAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is already in stock
    if (product.inStock && product.totalStock > 0) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in stock'
      });
    }

    // Check if alert already exists
    const existingAlert = await StockAlert.findOne({
      product: productId,
      user: userId
    });

    if (existingAlert) {
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed to alerts for this product',
        data: existingAlert
      });
    }

    // Get user email
    const User = (await import('../models/User')).default;
    const user = await User.findById(userId).select('email firstName');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create alert
    const alert = await StockAlert.create({
      product: productId,
      user: userId,
      email: user.email
    });

    res.status(201).json({
      success: true,
      message: 'Stock alert created. You will be notified when this product is back in stock.',
      data: alert
    });
  } catch (error) {
    next(error);
  }
};

// Get user's stock alerts
export const getMyStockAlerts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    const alerts = await StockAlert.find({ user: userId, isNotified: false })
      .populate('product', 'name slug images basePrice inStock totalStock')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};

// Remove stock alert
export const removeStockAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const userId = req.user?._id;

    const alert = await StockAlert.findOneAndDelete({
      product: productId,
      user: userId
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Stock alert not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock alert removed'
    });
  } catch (error) {
    next(error);
  }
};

// Check and notify stock alerts (should be run periodically via cron job)
export const checkAndNotifyStockAlerts = async () => {
  try {
    // Find products that are back in stock
    const backInStockProducts = await Product.find({
      inStock: true,
      totalStock: { $gt: 0 }
    }).lean();

    if (backInStockProducts.length === 0) {
      return;
    }

    const productIds = backInStockProducts.map(p => p._id);

    // Find active alerts for these products
    const alerts = await StockAlert.find({
      product: { $in: productIds },
      isNotified: false
    })
      .populate('product', 'name slug')
      .populate('user', 'firstName email')
      .lean();

    for (const alert of alerts) {
      try {
        const product = alert.product as any;
        const user = alert.user as any;

        if (!product || !user) continue;

        // Send notification email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const productUrl = `${frontendUrl}/product/${product.slug || product._id}`;

        const nodemailer = require('nodemailer');
        let transporter;
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@petshiwu.com',
            to: user.email,
            subject: `${product.name} is back in stock!`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Product Back in Stock</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                  <h1 style="margin: 0;">Product Back in Stock!</h1>
                </div>
                <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
                  <p>Hi ${user.firstName},</p>
                  <p>Great news! <strong>${product.name}</strong> is back in stock!</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${productUrl}" 
                       style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                      View Product
                    </a>
                  </div>
                  <p style="color: #666; font-size: 12px; margin-top: 20px;">
                    Best regards,<br>
                    The Petshiwu Team
                  </p>
                </div>
              </body>
              </html>
            `
          });

          // Mark as notified
          await StockAlert.findByIdAndUpdate(alert._id, {
            isNotified: true,
            notifiedAt: new Date()
          });

          logger.info(`Stock alert notification sent to ${user.email} for product ${product.name}`);
        }
      } catch (error: any) {
        logger.error(`Error sending stock alert to ${alert.email}:`, error.message);
      }
    }
  } catch (error: any) {
    logger.error('Error checking stock alerts:', error.message);
  }
};


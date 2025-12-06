import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import crypto from 'crypto';
import logger from '../utils/logger';
import { sendVerificationEmail } from '../utils/emailService';

// Share wishlist - Generate shareable link
export const shareWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.wishlist || user.wishlist.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Wishlist is empty. Add products to your wishlist before sharing.'
      });
    }

    // Generate a unique share token
    const shareToken = crypto.randomBytes(32).toString('hex');
    
    // Store share token in user document (you might want to add a shareToken field to User model)
    // For now, we'll generate it on-the-fly and include it in the response
    // In production, you might want to store this with expiration
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareUrl = `${frontendUrl}/wishlist/${userId}?token=${shareToken}`;
    const shareUrlShort = `${frontendUrl}/wishlist/${userId}`; // Public version (if you make wishlists public)

    res.status(200).json({
      success: true,
      data: {
        shareUrl,
        shareUrlShort,
        shareToken,
        wishlistCount: user.wishlist.length,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      message: 'Wishlist share link generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get shared wishlist (public endpoint)
export const getSharedWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { token } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(userId)
      .select('firstName lastName wishlist')
      .populate({
        path: 'wishlist',
        select: 'name slug images basePrice compareAtPrice brand averageRating totalReviews inStock isActive',
        match: { isActive: true }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    // Filter out null products
    const wishlistProducts = user.wishlist.filter((product: any) => product !== null);

    if (wishlistProducts.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          owner: {
            firstName: user.firstName,
            lastName: user.lastName
          },
          products: [],
          message: 'This wishlist is empty'
          }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        owner: {
          firstName: user.firstName,
          lastName: user.lastName
        },
        products: wishlistProducts,
        totalItems: wishlistProducts.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Email wishlist to someone
export const emailWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { recipientEmail, recipientName, message } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.wishlist || user.wishlist.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Wishlist is empty'
      });
    }

    // Get wishlist products
    const wishlistProducts = await Product.find({
      _id: { $in: user.wishlist },
      isActive: true
    })
      .select('name slug images basePrice compareAtPrice brand')
      .limit(20) // Limit to 20 products in email
      .lean();

    if (wishlistProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active products in wishlist'
      });
    }

    // Generate share link
    const shareToken = crypto.randomBytes(32).toString('hex');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareUrl = `${frontendUrl}/wishlist/${userId}?token=${shareToken}`;

    // Send email (you'll need to create an email template for wishlist sharing)
    try {
      const nodemailer = require('nodemailer');
      
      // Create transporter (reuse from emailService)
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
      } else {
        // Email not configured
        logger.warn('Email not configured. Wishlist email not sent.');
        return res.status(200).json({
          success: true,
          message: 'Wishlist share link generated. Email not configured, but you can share the link manually.',
          data: {
            shareUrl,
            products: wishlistProducts
          }
        });
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@petshiwu.com',
        to: recipientEmail,
        subject: `${user.firstName} ${user.lastName} shared their wishlist with you`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Wishlist Shared</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
              <h1 style="margin: 0;">Wishlist Shared</h1>
            </div>
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
              <p>Hi ${recipientName || 'there'},</p>
              <p><strong>${user.firstName} ${user.lastName}</strong> has shared their wishlist with you!</p>
              ${message ? `<p style="background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">"${message}"</p>` : ''}
              <p>The wishlist contains <strong>${wishlistProducts.length} item${wishlistProducts.length !== 1 ? 's' : ''}</strong>:</p>
              <div style="margin: 20px 0;">
                ${wishlistProducts.map((product: any) => `
                  <div style="background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #ddd;">
                    <h3 style="margin: 0 0 10px 0;">${product.name}</h3>
                    <p style="margin: 5px 0; color: #666;">Brand: ${product.brand}</p>
                    <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #4CAF50;">$${product.basePrice.toFixed(2)}</p>
                  </div>
                `).join('')}
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${shareUrl}" 
                   style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  View Full Wishlist
                </a>
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 20px;">
                Best regards,<br>
                The Petshiwu Team
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
          Wishlist Shared
          
          Hi ${recipientName || 'there'},
          
          ${user.firstName} ${user.lastName} has shared their wishlist with you!
          
          ${message ? `Message: "${message}"` : ''}
          
          The wishlist contains ${wishlistProducts.length} item${wishlistProducts.length !== 1 ? 's' : ''}.
          
          View the full wishlist: ${shareUrl}
          
          Best regards,
          The Petshiwu Team
        `
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Wishlist email sent to ${recipientEmail} from user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Wishlist shared via email successfully',
        data: {
          recipientEmail,
          shareUrl
        }
      });
    } catch (emailError: any) {
      logger.error('Error sending wishlist email:', emailError);
      // Still return success with share URL
      res.status(200).json({
        success: true,
        message: 'Wishlist share link generated. Email sending failed, but you can share the link manually.',
        data: {
          shareUrl,
          products: wishlistProducts
        }
      });
    }
  } catch (error) {
    next(error);
  }
};


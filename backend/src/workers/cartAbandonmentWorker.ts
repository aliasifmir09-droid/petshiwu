import Cart, { ICart } from '../models/Cart';
import User from '../models/User';
import { getEmailQueue, addEmailJob } from '../utils/jobQueue';
import { sendCartAbandonmentEmail } from '../utils/emailService';
import logger from '../utils/logger';
import mongoose from 'mongoose';

/**
 * Check for abandoned carts and send recovery emails
 * Carts are considered abandoned if:
 * - Last updated more than 24 hours ago
 * - Not already marked as abandoned or recovery email sent
 * - Has items
 * - User has email (for authenticated users)
 */
export const checkAbandonedCarts = async (): Promise<void> => {
  try {
    const abandonmentThreshold = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const cutoffTime = new Date(Date.now() - abandonmentThreshold);

    // Find carts that haven't been updated in 24+ hours and haven't been marked as abandoned
    const abandonedCarts = await Cart.find({
      lastUpdated: { $lt: cutoffTime },
      $or: [
        { abandonedAt: { $exists: false } },
        { abandonedAt: null }
      ],
      recoveryEmailSent: { $ne: true },
      'items.0': { $exists: true } // Has at least one item
    }).populate('user', 'email firstName').limit(50); // Process 50 at a time

    logger.info(`Found ${abandonedCarts.length} abandoned carts to process`);

    for (const cart of abandonedCarts) {
      try {
        // Mark cart as abandoned
        cart.abandonedAt = new Date();
        await cart.save();

        // Only send email if user is authenticated and has email
        if (cart.user && typeof cart.user === 'object' && 'email' in cart.user) {
          const user = cart.user as any;
          const email = user.email;
          const firstName = user.firstName || 'Customer';

          if (email) {
            const frontendUrl = process.env.FRONTEND_URL || 'https://petshiwu.com';
            const cartUrl = cart.shareId 
              ? `${frontendUrl}/cart?share=${cart.shareId}`
              : `${frontendUrl}/cart`;

            // Prepare cart items for email
            const cartItems = cart.items.map(item => ({
              name: item.name,
              image: item.image,
              quantity: item.quantity,
              price: item.price
            }));

            // Send email via job queue
            await addEmailJob(
              'cart-abandonment',
              {
                email,
                firstName,
                cartItems,
                cartUrl,
                cartId: (cart._id as mongoose.Types.ObjectId).toString()
              },
              async () => {
                await sendCartAbandonmentEmail(email, firstName, cartItems, cartUrl);
              }
            );

            // Mark recovery email as sent
            cart.recoveryEmailSent = true;
            cart.recoveryEmailSentAt = new Date();
            await cart.save();

            logger.info(`Cart abandonment email queued for ${email}`);
          }
        }
      } catch (error: any) {
        const cartId = (cart._id as mongoose.Types.ObjectId).toString();
        logger.error(`Error processing abandoned cart ${cartId}:`, error.message);
        // Continue with next cart even if one fails
      }
    }
  } catch (error: any) {
    logger.error('Error checking abandoned carts:', error.message);
  }
};

/**
 * Start cart abandonment worker (runs periodically)
 */
export const startCartAbandonmentWorker = (): void => {
  // Run immediately on startup (after a delay to let server start)
  setTimeout(() => {
    checkAbandonedCarts().catch(err => {
      logger.error('Error in initial cart abandonment check:', err);
    });
  }, 5 * 60 * 1000); // 5 minutes after startup

  // Then run every 6 hours
  setInterval(() => {
    checkAbandonedCarts().catch(err => {
      logger.error('Error in cart abandonment check:', err);
    });
  }, 6 * 60 * 60 * 1000); // Every 6 hours

  logger.info('✅ Cart abandonment worker started');
};


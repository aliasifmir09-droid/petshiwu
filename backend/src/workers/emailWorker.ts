import { getEmailQueue } from '../utils/jobQueue';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  sendOrderDeliveredEmail,
} from '../utils/emailService';
import logger from '../utils/logger';
import { Job } from 'bull';

/**
 * Email worker - processes email jobs from the queue
 * This should be run as a separate process or in a worker thread
 */
export const startEmailWorker = (): void => {
  try {
    const emailQueue = getEmailQueue();

    if (!emailQueue) {
      logger.warn('⚠️  Email queue not available. Email worker will not start.');
      return;
    }

    logger.info('📧 Starting email worker...');

    // CRITICAL FIX: Wrap queue.process calls in try-catch to prevent uncaught exceptions
    try {
      // Process verification emails
      emailQueue.process('verification', async (job: Job) => {
        const { email, token, firstName } = job.data;
        logger.info(`Processing verification email job for ${email}`);
        await sendVerificationEmail(email, token, firstName);
      });

      // Process password reset emails
      emailQueue.process('password-reset', async (job: Job) => {
        const { email, token, firstName } = job.data;
        logger.info(`Processing password reset email job for ${email}`);
        await sendPasswordResetEmail(email, token, firstName);
      });

      // Process order confirmation emails
      emailQueue.process('order-confirmation', async (job: Job) => {
        const { email, firstName, orderNumber, orderData } = job.data;
        logger.info(`Processing order confirmation email job for order ${orderNumber}`);
        await sendOrderConfirmationEmail(email, firstName, orderNumber, orderData);
      });

      // Process order cancellation emails
      emailQueue.process('order-cancellation', async (job: Job) => {
        const { email, firstName, orderNumber, orderData } = job.data;
        logger.info(`Processing order cancellation email job for order ${orderNumber}`);
        await sendOrderCancellationEmail(email, firstName, orderNumber, orderData);
      });

      // Process order delivered emails
      emailQueue.process('order-delivered', async (job: Job) => {
        const { email, firstName, orderNumber, orderData } = job.data;
        logger.info(`Processing order delivered email job for order ${orderNumber}`);
        await sendOrderDeliveredEmail(email, firstName, orderNumber, orderData);
      });

      logger.info('✅ Email worker started successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('❌ Error starting email worker:', errorMessage);
      logger.warn('⚠️  Email worker will not be available.');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ Error initializing email worker:', errorMessage);
    logger.warn('⚠️  Email worker will not be available.');
  }
};


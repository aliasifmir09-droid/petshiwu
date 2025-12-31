import { getEmailQueue } from '../utils/jobQueue';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  sendOrderDeliveredEmail,
} from '../utils/emailService';
import logger from '../utils/logger';

/**
 * Email worker - processes email jobs from the queue
 * This should be run as a separate process or in a worker thread
 */
export const startEmailWorker = (): void => {
  const emailQueue = getEmailQueue();

  if (!emailQueue) {
    logger.warn('⚠️  Email queue not available. Email worker will not start.');
    return;
  }

  logger.info('📧 Starting email worker...');

  // Process verification emails
  emailQueue.process('verification', async (job) => {
    const { email, token, firstName } = job.data;
    logger.info(`Processing verification email job for ${email}`);
    await sendVerificationEmail(email, token, firstName);
  });

  // Process password reset emails
  emailQueue.process('password-reset', async (job) => {
    const { email, token, firstName } = job.data;
    logger.info(`Processing password reset email job for ${email}`);
    await sendPasswordResetEmail(email, token, firstName);
  });

  // Process order confirmation emails
  emailQueue.process('order-confirmation', async (job) => {
    const { email, firstName, orderNumber, orderData } = job.data;
    logger.info(`Processing order confirmation email job for order ${orderNumber}`);
    await sendOrderConfirmationEmail(email, firstName, orderNumber, orderData);
  });

  // Process order cancellation emails
  emailQueue.process('order-cancellation', async (job) => {
    const { email, firstName, orderNumber, orderData } = job.data;
    logger.info(`Processing order cancellation email job for order ${orderNumber}`);
    await sendOrderCancellationEmail(email, firstName, orderNumber, orderData);
  });

  // Process order delivered emails
  emailQueue.process('order-delivered', async (job) => {
    const { email, firstName, orderNumber, orderData } = job.data;
    logger.info(`Processing order delivered email job for order ${orderNumber}`);
    await sendOrderDeliveredEmail(email, firstName, orderNumber, orderData);
  });

  logger.info('✅ Email worker started successfully');
};


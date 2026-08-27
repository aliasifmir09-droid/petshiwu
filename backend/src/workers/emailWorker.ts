import { Queue, Job } from 'bull';
import { getEmailQueue } from '../utils/jobQueue';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  sendOrderDeliveredEmail,
  sendOrderStatusEmail,
  sendCartAbandonmentEmail,
  sendWelcomeEmail,
} from '../utils/emailService';
import logger from '../utils/logger';

export const EMAIL_WORKER_JOB_TYPES = [
  'verification',
  'password-reset',
  'order-confirmation',
  'order-cancellation',
  'order-delivered',
  'order-status',
  'cart-abandonment',
  'welcome',
] as const;

/**
 * Register every email job the API can queue. Missing processors leave jobs
 * stuck in Redis, which is why cancellation emails never arrived.
 */
export const registerEmailProcessors = (emailQueue: Pick<Queue, 'process'>): void => {
  emailQueue.process('verification', async (job: Job) => {
    const { email, token, firstName } = job.data;
    logger.info(`Processing verification email job for ${email}`);
    await sendVerificationEmail(email, token, firstName);
  });

  emailQueue.process('password-reset', async (job: Job) => {
    const { email, token, firstName } = job.data;
    logger.info(`Processing password reset email job for ${email}`);
    await sendPasswordResetEmail(email, token, firstName);
  });

  emailQueue.process('order-confirmation', async (job: Job) => {
    const { email, firstName, orderNumber, orderData } = job.data;
    logger.info(`Processing order confirmation email job for order ${orderNumber}`);
    await sendOrderConfirmationEmail(email, firstName, orderNumber, orderData);
  });

  emailQueue.process('order-cancellation', async (job: Job) => {
    const { email, firstName, orderNumber, orderData } = job.data;
    logger.info(`Processing order cancellation email job for order ${orderNumber}`);
    await sendOrderCancellationEmail(email, firstName, orderNumber, orderData);
  });

  emailQueue.process('order-delivered', async (job: Job) => {
    const { email, firstName, orderNumber, orderData } = job.data;
    logger.info(`Processing order delivered email job for order ${orderNumber}`);
    await sendOrderDeliveredEmail(email, firstName, orderNumber, orderData);
  });

  emailQueue.process('order-status', async (job: Job) => {
    const { email, firstName, orderNumber, orderData } = job.data;
    logger.info(`Processing order status email job for order ${orderNumber}`);
    await sendOrderStatusEmail(email, firstName, orderNumber, orderData);
  });

  emailQueue.process('cart-abandonment', async (job: Job) => {
    const { email, firstName, cartItems, cartUrl } = job.data;
    logger.info(`Processing cart abandonment email job for ${email}`);
    await sendCartAbandonmentEmail(email, firstName, cartItems, cartUrl);
  });

  emailQueue.process('welcome', async (job: Job) => {
    const { email, firstName } = job.data;
    logger.info(`Processing welcome email job for ${email}`);
    await sendWelcomeEmail(email, firstName);
  });
};

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

    try {
      registerEmailProcessors(emailQueue);
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

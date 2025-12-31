import Bull, { Queue } from 'bull';
import { getRedisClient } from './cache';
import logger from './logger';

// Job queue instance (null if Redis not available)
let emailQueue: Queue | null = null;
let imageProcessingQueue: Queue | null = null;
let csvProcessingQueue: Queue | null = null;

/**
 * Initialize job queues with Redis
 * Falls back gracefully if Redis is not available
 */
export const initializeJobQueues = (): void => {
  const redisClient = getRedisClient();
  
  if (!redisClient) {
    logger.warn('⚠️  Redis not available. Job queues will not be initialized.');
    logger.warn('   Background job processing will be disabled.');
    logger.warn('   Heavy operations will run synchronously.');
    return;
  }

  try {
    // Get Redis connection string for Bull
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      logger.warn('⚠️  REDIS_URL not set. Job queues will not be initialized.');
      return;
    }

    // Email queue - for sending emails asynchronously
    emailQueue = new Bull('email-queue', redisUrl, {
      defaultJobOptions: {
        attempts: 3, // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 seconds, double each retry
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
      settings: {
        maxStalledCount: 1, // Mark job as failed if it stalls once
      },
    });

    // Image processing queue - for image optimization/processing
    imageProcessingQueue = new Bull('image-processing-queue', redisUrl, {
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 12 * 3600, // Keep completed jobs for 12 hours
          count: 500,
        },
        removeOnFail: {
          age: 3 * 24 * 3600, // Keep failed jobs for 3 days
        },
      },
    });

    // CSV processing queue - for CSV imports/exports
    csvProcessingQueue = new Bull('csv-processing-queue', redisUrl, {
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        removeOnComplete: {
          age: 12 * 3600,
          count: 100,
        },
        removeOnFail: {
          age: 3 * 24 * 3600,
        },
      },
    });

    // Queue event handlers
    emailQueue.on('completed', (job) => {
      logger.debug(`✅ Email job ${job.id} completed`);
    });

    emailQueue.on('failed', (job, err) => {
      logger.error(`❌ Email job ${job?.id} failed:`, err.message);
    });

    imageProcessingQueue.on('completed', (job) => {
      logger.debug(`✅ Image processing job ${job.id} completed`);
    });

    imageProcessingQueue.on('failed', (job, err) => {
      logger.error(`❌ Image processing job ${job?.id} failed:`, err.message);
    });

    csvProcessingQueue.on('completed', (job) => {
      logger.debug(`✅ CSV processing job ${job.id} completed`);
    });

    csvProcessingQueue.on('failed', (job, err) => {
      logger.error(`❌ CSV processing job ${job?.id} failed:`, err.message);
    });

    logger.info('✅ Job queues initialized successfully');
  } catch (error: any) {
    logger.error('❌ Error initializing job queues:', error.message);
    logger.warn('⚠️  Background job processing will be disabled.');
  }
};

/**
 * Get email queue (returns null if not available)
 */
export const getEmailQueue = (): Queue | null => {
  return emailQueue;
};

/**
 * Get image processing queue (returns null if not available)
 */
export const getImageProcessingQueue = (): Queue | null => {
  return imageProcessingQueue;
};

/**
 * Get CSV processing queue (returns null if not available)
 */
export const getCSVProcessingQueue = (): Queue | null => {
  return csvProcessingQueue;
};

/**
 * Add email job to queue
 * Falls back to synchronous execution if queue not available
 */
export const addEmailJob = async (
  jobType: 'verification' | 'password-reset' | 'order-confirmation' | 'order-cancellation' | 'order-delivered',
  data: any,
  executeFn: () => Promise<void>
): Promise<void> => {
  const queue = getEmailQueue();
  
  if (!queue) {
    // Fallback to synchronous execution if queue not available
    logger.debug('Job queue not available, executing email synchronously');
    try {
      await executeFn();
    } catch (error: any) {
      logger.error(`Error executing email job ${jobType}:`, error.message);
      throw error;
    }
    return;
  }

  try {
    await queue.add(jobType, data, {
      priority: jobType === 'password-reset' ? 1 : 5, // Password reset has higher priority
      delay: 0, // Execute immediately
    });
    logger.debug(`📧 Email job ${jobType} added to queue`);
  } catch (error: any) {
    logger.error(`Error adding email job ${jobType} to queue:`, error.message);
    // Fallback to synchronous execution on error
    try {
      await executeFn();
    } catch (execError: any) {
      logger.error(`Error executing email job ${jobType} (fallback):`, execError.message);
      throw execError;
    }
  }
};

/**
 * Get queue statistics
 */
export const getQueueStats = async () => {
  const stats: any = {
    emailQueue: null,
    imageProcessingQueue: null,
    csvProcessingQueue: null,
  };

  if (emailQueue) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
      emailQueue.getDelayedCount(),
    ]);

    stats.emailQueue = {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  if (imageProcessingQueue) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      imageProcessingQueue.getWaitingCount(),
      imageProcessingQueue.getActiveCount(),
      imageProcessingQueue.getCompletedCount(),
      imageProcessingQueue.getFailedCount(),
      imageProcessingQueue.getDelayedCount(),
    ]);

    stats.imageProcessingQueue = {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  if (csvProcessingQueue) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      csvProcessingQueue.getWaitingCount(),
      csvProcessingQueue.getActiveCount(),
      csvProcessingQueue.getCompletedCount(),
      csvProcessingQueue.getFailedCount(),
      csvProcessingQueue.getDelayedCount(),
    ]);

    stats.csvProcessingQueue = {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  return stats;
};

/**
 * Clean up job queues (graceful shutdown)
 */
export const closeJobQueues = async (): Promise<void> => {
  const queues = [emailQueue, imageProcessingQueue, csvProcessingQueue].filter(Boolean) as Queue[];
  
  await Promise.all(
    queues.map(async (queue) => {
      try {
        await queue.close();
        logger.info(`✅ Job queue ${queue.name} closed`);
      } catch (error: any) {
        logger.error(`Error closing job queue ${queue.name}:`, error.message);
      }
    })
  );
};


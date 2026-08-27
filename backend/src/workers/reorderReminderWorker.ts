import ReorderReminder from '../models/ReorderReminder';
import { sendReorderReminderEmail } from '../utils/emailService';
import {
  intervalFromReminder,
  nextRemindAt,
  normalizeRestockMode,
  restockEmailPath,
  weeksFromInterval,
} from '../utils/buyAgain';
import logger from '../utils/logger';

const CHECK_EVERY_MS = 60 * 60 * 1000;

export const processDueReorderReminders = async (now: Date = new Date()): Promise<number> => {
  const due = await ReorderReminder.find({
    status: 'scheduled',
    remindAt: { $lte: now },
  }).limit(50);

  let sent = 0;
  for (const reminder of due) {
    try {
      const mode = normalizeRestockMode(reminder.mode);
      const intervalDays = intervalFromReminder(reminder);
      const weeks = weeksFromInterval(intervalDays);
      await sendReorderReminderEmail(
        reminder.email,
        reminder.firstName,
        reminder.orderNumber,
        {
          weeks,
          items: reminder.items,
          mode,
          buyAgainUrlPath: restockEmailPath(mode),
        }
      );
      reminder.status = 'sent';
      reminder.sentAt = new Date();
      await reminder.save();

      await ReorderReminder.create({
        user: reminder.user,
        order: reminder.order,
        orderNumber: reminder.orderNumber,
        email: reminder.email,
        firstName: reminder.firstName,
        weeks,
        intervalDays,
        mode,
        remindAt: nextRemindAt(intervalDays, reminder.remindAt || now, now),
        status: 'scheduled',
        items: reminder.items,
      });

      sent += 1;
    } catch (error) {
      logger.error(`Failed to send reorder reminder for ${reminder.orderNumber}:`, error);
    }
  }
  if (sent > 0) {
    logger.info(`Restock reminders sent: ${sent}`);
  }
  return sent;
};

export const startReorderReminderWorker = (): void => {
  logger.info('📦 Restock reminder worker started (hourly, Ask first or Autoship, never silent charge)');
  setTimeout(() => {
    processDueReorderReminders().catch((error) => {
      logger.error('Reorder reminder worker error:', error);
    });
  }, 2 * 60 * 1000);

  setInterval(() => {
    processDueReorderReminders().catch((error) => {
      logger.error('Reorder reminder worker error:', error);
    });
  }, CHECK_EVERY_MS);
};

import cron from 'node-cron';
import { runFollowUpReminder } from './followUpReminder.js';
import { runMonthlyAiReset } from './monthlyAiReset.js';
import logger from '../utils/logger.js';

export function startScheduler() {
  // Daily at 09:00 AM UTC
  cron.schedule('0 9 * * *', () => {
    runFollowUpReminder().catch((err) =>
      logger.error(`followUpReminder failed: ${err.message}`)
    );
  }, { timezone: 'UTC' });

  // 1st of each month at 00:01 AM UTC
  cron.schedule('1 0 1 * *', () => {
    runMonthlyAiReset().catch((err) =>
      logger.error(`monthlyAiReset failed: ${err.message}`)
    );
  }, { timezone: 'UTC' });

  logger.info('Scheduler started: followUpReminder (daily 09:00 UTC), monthlyAiReset (1st of month)');
}

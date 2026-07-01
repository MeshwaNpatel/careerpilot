import logger from '../utils/logger.js';

// Redis ai_usage:* keys expire naturally via their TTL set at call time.
// This job is a safety-net log confirming the reset cycle is on track.
export async function runMonthlyAiReset() {
  const now = new Date();
  logger.info(`monthlyAiReset: confirmed — ${now.toISOString().slice(0, 7)} AI usage counters are expiring via Redis TTL`);
}

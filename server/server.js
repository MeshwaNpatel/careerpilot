import 'dotenv/config';
import { validateEnv } from './src/utils/validateEnv.js';
import app from './src/app.js';
import logger from './src/utils/logger.js';
import { startScheduler } from './src/jobs/scheduler.js';

validateEnv();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`CareerPilot API listening on port ${PORT}`);
  startScheduler();
});

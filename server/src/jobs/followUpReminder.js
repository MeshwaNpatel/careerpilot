import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import prisma from '../config/db.js';
import { sendEmail } from '../utils/sendEmail.js';
import { createNotification } from '../modules/notifications/notifications.service.js';
import logger from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, '../templates/email/followUpReminder.html');
const htmlTemplate = readFileSync(templatePath, 'utf-8');
const APP_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';

function fillTemplate(template, vars) {
  return Object.entries(vars).reduce(
    (html, [key, val]) => html.replaceAll(`{{${key}}}`, val ?? ''),
    template
  );
}

export async function runFollowUpReminder() {
  logger.info('followUpReminder: job started');

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const applications = await prisma.application.findMany({
    where: {
      followUpDate: { gte: today, lt: tomorrow },
      status: { notIn: ['offer', 'rejected'] },
      isArchived: false,
    },
    include: {
      user: { select: { id: true, name: true, email: true, emailNotifications: true, followUpReminders: true } },
    },
  });

  logger.info(`followUpReminder: found ${applications.length} application(s) due today`);

  for (const app of applications) {
    const { user } = app;
    if (!user.followUpReminders) continue;

    // Always create in-app notification
    await createNotification(user.id, {
      type: 'follow_up_reminder',
      title: `Follow up with ${app.company}`,
      message: `Today is your scheduled follow-up date for ${app.roleTitle} at ${app.company}.`,
    });

    // Send email only if user has email notifications enabled
    if (user.emailNotifications) {
      const html = fillTemplate(htmlTemplate, {
        name: user.name,
        company: app.company,
        role: app.roleTitle,
        applicationId: app.id,
        appUrl: APP_URL,
      });

      await sendEmail({
        to: user.email,
        subject: `Reminder: Follow up with ${app.company} today`,
        html,
      });
    }
  }

  logger.info('followUpReminder: job completed');
}

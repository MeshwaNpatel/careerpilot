import sgMail from '@sendgrid/mail';
import logger from './logger.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = process.env.SENDGRID_FROM_EMAIL ?? 'noreply@careerpilot.app';

export async function sendEmail({ to, subject, html }) {
  try {
    await sgMail.send({ to, from: FROM, subject, html });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    // Log but never throw — email failures must not break the main flow.
    logger.error(`SendGrid error sending to ${to}: ${err.message}`);
  }
}

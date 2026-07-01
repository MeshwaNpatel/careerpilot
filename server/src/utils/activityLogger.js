import prisma from '../config/db.js';

export async function logActivity(applicationId, userId, type, metadata = {}) {
  try {
    await prisma.activityLog.create({
      data: { applicationId, userId, type, metadata },
    });
  } catch {
    // Non-fatal — never block the main operation
  }
}

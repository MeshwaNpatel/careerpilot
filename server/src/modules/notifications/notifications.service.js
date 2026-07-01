import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';

export async function listNotifications(userId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getUnreadCount(userId) {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { count };
}

export async function markRead(userId, id) {
  const notification = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notification) throw new ApiError('Notification not found', 404);

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { success: true };
}

export async function createNotification(userId, { type, title, message }) {
  return prisma.notification.create({
    data: { userId, type, title, message },
  });
}

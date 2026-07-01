import * as notificationsService from './notifications.service.js';

export async function list(req, res, next) {
  try {
    const notifications = await notificationsService.listNotifications(req.user.userId);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}

export async function unreadCount(req, res, next) {
  try {
    const result = await notificationsService.getUnreadCount(req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    const notification = await notificationsService.markRead(req.user.userId, req.params.id);
    res.json({ notification });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req, res, next) {
  try {
    const result = await notificationsService.markAllRead(req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

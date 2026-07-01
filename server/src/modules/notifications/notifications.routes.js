import { Router } from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import * as notificationsController from './notifications.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/', notificationsController.list);
router.get('/unread-count', notificationsController.unreadCount);
router.patch('/read-all', notificationsController.markAllRead);
router.patch('/:id/read', notificationsController.markRead);

export default router;

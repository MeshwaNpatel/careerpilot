import { Router } from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import requireAdmin from '../../middleware/requireAdmin.js';
import * as adminController from './admin.controller.js';

const router = Router();

router.use(verifyToken, requireAdmin);

// Analytics
router.get('/analytics', adminController.getAnalytics);

// User management
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUserDetail);
router.patch('/users/:id/ban', adminController.banUser);
router.patch('/users/:id/plan', adminController.changeUserPlan);
router.delete('/users/:id', adminController.deleteUser);

// AI usage
router.get('/ai-usage', adminController.getAiUsage);

// Broadcast notifications
router.post('/notifications/broadcast', adminController.broadcast);
router.get('/notifications/broadcast/history', adminController.getBroadcastHistory);

// Feature flags
router.get('/flags', adminController.getFlags);
router.patch('/flags/:key', adminController.setFlag);

export default router;

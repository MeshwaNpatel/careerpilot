import { Router } from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import * as analyticsController from './analytics.controller.js';

const router = Router();

router.use(verifyToken);
router.get('/user', analyticsController.getUserAnalytics);

export default router;

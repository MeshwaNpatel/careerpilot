import { Router } from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import * as subscriptionsController from './subscriptions.controller.js';

const router = Router();

// All protected routes
router.get('/my', verifyToken, subscriptionsController.getMy);
router.post('/create-checkout', verifyToken, subscriptionsController.createCheckout);
router.post('/portal', verifyToken, subscriptionsController.createPortal);

export default router;

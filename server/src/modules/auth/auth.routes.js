import { Router } from 'express';
import passport from '../../config/passport.js';
import verifyToken from '../../middleware/verifyToken.js';
import validateRequest from '../../middleware/validateRequest.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/logout', verifyToken, authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', verifyToken, authController.me);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPasswordHandler);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback
);

export default router;

import { Router } from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import validateRequest from '../../middleware/validateRequest.js';
import checkPlanLimit from '../../middleware/checkPlanLimit.js';
import * as aiController from './ai.controller.js';
import { reviewResumeSchema, coverLetterSchema, interviewPrepSchema } from './ai.validation.js';

const router = Router();

router.use(verifyToken);

// Usage check — no plan-limit gate needed
router.get('/usage', aiController.getUsage);

router.use(checkPlanLimit);

router.post(
  '/review-resume',
  validateRequest(reviewResumeSchema),
  aiController.reviewResume
);

router.post(
  '/cover-letter',
  validateRequest(coverLetterSchema),
  aiController.generateCoverLetter
);

router.post(
  '/interview-prep',
  validateRequest(interviewPrepSchema),
  aiController.generateInterviewPrep
);

export default router;

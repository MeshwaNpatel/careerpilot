import { Router } from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import validateRequest from '../../middleware/validateRequest.js';
import uploadResume from '../../middleware/uploadResume.js';
import * as resumesController from './resumes.controller.js';
import { uploadResumeSchema, updateResumeSchema } from './resumes.validation.js';

const router = Router();

router.use(verifyToken);

router.get('/', resumesController.list);
router.post('/', uploadResume, validateRequest(uploadResumeSchema), resumesController.upload);
router.patch('/:id', validateRequest(updateResumeSchema), resumesController.update);
router.delete('/:id', resumesController.remove);

export default router;

import { Router } from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import validateRequest from '../../middleware/validateRequest.js';
import { createInterviewSchema, updateInterviewSchema } from './interviews.validation.js';
import * as controller from './interviews.controller.js';

const router = Router({ mergeParams: true });

router.use(verifyToken);

router.get('/', controller.list);
router.post('/', validateRequest(createInterviewSchema), controller.create);
router.patch('/:id', validateRequest(updateInterviewSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;

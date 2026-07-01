import { Router } from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import validateRequest from '../../middleware/validateRequest.js';
import { createContactSchema, updateContactSchema } from './contacts.validation.js';
import * as controller from './contacts.controller.js';

const router = Router({ mergeParams: true });

router.use(verifyToken);

router.get('/', controller.list);
router.post('/', validateRequest(createContactSchema), controller.create);
router.patch('/:id', validateRequest(updateContactSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;

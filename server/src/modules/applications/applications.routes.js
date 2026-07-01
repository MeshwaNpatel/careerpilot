import { Router } from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import validateRequest from '../../middleware/validateRequest.js';
import * as applicationsController from './applications.controller.js';
import {
  createApplicationSchema,
  updateApplicationSchema,
  updateStatusSchema,
  listApplicationsQuerySchema,
} from './applications.validation.js';

const router = Router();

router.use(verifyToken);

router.get('/', validateRequest(listApplicationsQuerySchema, 'query'), applicationsController.list);
router.get('/export', applicationsController.exportCsv);
router.post('/', validateRequest(createApplicationSchema), applicationsController.create);
router.get('/:id', applicationsController.getById);
router.get('/:id/activity', applicationsController.getActivity);
router.patch('/:id', validateRequest(updateApplicationSchema), applicationsController.update);
router.delete('/:id', applicationsController.remove);
router.patch('/:id/status', validateRequest(updateStatusSchema), applicationsController.updateStatus);

export default router;

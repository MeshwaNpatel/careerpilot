import { Router } from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import { search, saveJob, listSaved, unsaveJob, moveToPipeline } from './jobs.controller.js';

const router = Router();
router.use(verifyToken);
router.get('/search', search);
router.get('/saved', listSaved);
router.post('/saved', saveJob);
router.delete('/saved/:id', unsaveJob);
router.post('/saved/:id/apply', moveToPipeline);

export default router;

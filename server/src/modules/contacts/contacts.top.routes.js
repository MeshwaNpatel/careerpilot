import { Router } from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import { listAllContacts } from './contacts.service.js';

const router = Router();

router.use(verifyToken);

router.get('/', async (req, res, next) => {
  try {
    const contacts = await listAllContacts(req.user.userId);
    res.json(contacts);
  } catch (err) {
    next(err);
  }
});

export default router;

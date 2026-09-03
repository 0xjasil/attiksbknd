import { Router } from 'express';
import { login, getProfile, loginSchema } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/profile', requireAuth, getProfile);

export default router;

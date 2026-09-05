import { Router } from 'express';
import { login, getProfile, loginSchema } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Public Login with strict rate limiting against brute force
router.post('/login', authRateLimiter, validate(loginSchema), login);

// Protected Profile Inspection
router.get('/profile', requireAuth, getProfile);
router.get('/me', requireAuth, getProfile);

export default router;

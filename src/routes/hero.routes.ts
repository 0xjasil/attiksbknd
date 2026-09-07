import { Router } from 'express';
import {
  getHero,
  createHeroOrAction,
  updateHeroSlide,
  deleteHeroSlide,
} from '../controllers/hero.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Public / Admin fetch
router.get('/', getHero);

// Admin actions (Protected)
router.post('/', requireAuth, createHeroOrAction);
router.put('/:id', requireAuth, updateHeroSlide);
router.delete('/:id', requireAuth, deleteHeroSlide);

export default router;

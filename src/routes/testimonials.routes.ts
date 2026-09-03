import { Router } from 'express';
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '../controllers/testimonials.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getTestimonials);
router.post('/', requireAuth, requireRole(['ADMIN']), createTestimonial);
router.put('/:id', requireAuth, requireRole(['ADMIN']), updateTestimonial);
router.delete('/:id', requireAuth, requireRole(['ADMIN']), deleteTestimonial);

export default router;

import { Router } from 'express';
import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  testimonialSchema,
  updateTestimonialSchema,
} from '../controllers/testimonials.controller';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// Public active reviews
router.get('/', getTestimonials);

// Admin review management
router.post('/', validate(testimonialSchema), createTestimonial);
router.put('/:id', validate(updateTestimonialSchema), updateTestimonial);
router.patch('/:id', validate(updateTestimonialSchema), updateTestimonial);
router.delete('/:id', deleteTestimonial);

export default router;

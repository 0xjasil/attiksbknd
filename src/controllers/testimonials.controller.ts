import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { appCache } from '../utils/cache';
import { sendSuccess } from '../utils/response';

export const testimonialSchema = z.object({
  body: z.object({
    quote: z.string().min(5, 'Quote must be at least 5 characters'),
    author: z.string().min(2, 'Author name is required'),
    designation: z.string().min(2, 'Designation is required'),
    order: z.number().optional().default(0),
    active: z.boolean().optional().default(true),
  }),
});

export const updateTestimonialSchema = z.object({
  body: z.object({
    quote: z.string().min(5).optional(),
    author: z.string().min(2).optional(),
    designation: z.string().min(2).optional(),
    order: z.number().optional(),
    active: z.boolean().optional(),
  }),
});

export async function getTestimonials(req: Request, res: Response, next: NextFunction) {
  try {
    const cacheKey = 'testimonials:active';
    const cached = appCache.get(cacheKey);
    if (cached) {
      return sendSuccess(res, cached, 'Testimonials fetched from cache');
    }

    const testimonials = await prisma.testimonial.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    appCache.set(cacheKey, testimonials, 120); // 2min TTL
    return sendSuccess(res, testimonials, 'Testimonials fetched successfully');
  } catch (error) {
    next(error);
  }
}

export async function createTestimonial(req: Request, res: Response, next: NextFunction) {
  try {
    const testimonial = await prisma.testimonial.create({ data: req.body });
    appCache.invalidatePrefix('testimonials:');
    return sendSuccess(res, testimonial, 'Testimonial created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateTestimonial(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const testimonial = await prisma.testimonial.update({ where: { id }, data: req.body });
    appCache.invalidatePrefix('testimonials:');
    return sendSuccess(res, testimonial, 'Testimonial updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteTestimonial(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await prisma.testimonial.delete({ where: { id } });
    appCache.invalidatePrefix('testimonials:');
    return sendSuccess(res, { id, deleted: true }, 'Testimonial deleted successfully');
  } catch (error) {
    next(error);
  }
}

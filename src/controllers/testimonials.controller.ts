import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';

export async function getTestimonials(req: Request, res: Response, next: NextFunction) {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    return sendSuccess(res, testimonials, 'Testimonials fetched successfully');
  } catch (error) {
    next(error);
  }
}

export async function createTestimonial(req: Request, res: Response, next: NextFunction) {
  try {
    const testimonial = await prisma.testimonial.create({ data: req.body });
    return sendSuccess(res, testimonial, 'Testimonial created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateTestimonial(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const testimonial = await prisma.testimonial.update({ where: { id }, data: req.body });
    return sendSuccess(res, testimonial, 'Testimonial updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteTestimonial(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await prisma.testimonial.delete({ where: { id } });
    return sendSuccess(res, null, 'Testimonial deleted successfully');
  } catch (error) {
    next(error);
  }
}

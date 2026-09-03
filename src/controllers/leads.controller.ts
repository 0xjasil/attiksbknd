import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export const leadSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    message: z.string().optional(),
    projectTitle: z.string().optional(),
    projectId: z.string().optional(),
  }),
});

export async function submitLead(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;

    const lead = await prisma.lead.create({
      data,
    });

    return sendSuccess(res, lead, 'Inquiry received. Thank you!', 201);
  } catch (error) {
    next(error);
  }
}

export async function getLeads(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) where.status = status as any;

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    return sendSuccess(res, leads, 'Leads fetched successfully');
  } catch (error) {
    next(error);
  }
}

export async function updateLeadStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { status, notes } = req.body;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return sendSuccess(res, lead, 'Lead updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteLead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);

    await prisma.lead.delete({
      where: { id },
    });

    return sendSuccess(res, null, 'Lead deleted successfully');
  } catch (error) {
    next(error);
  }
}

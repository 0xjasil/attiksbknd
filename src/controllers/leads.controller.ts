import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export const leadSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional().nullable(),
    message: z.string().optional().nullable(),
    projectTitle: z.string().optional().nullable(),
    projectId: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
  }),
});

export async function submitLead(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, phone, message, projectTitle, projectId, notes, source, status } = req.body;

    let combinedNotes = notes ? String(notes).trim() : '';
    if (source) {
      const sourceStr = `Source: ${source}`;
      if (!combinedNotes) {
        combinedNotes = sourceStr;
      } else if (!combinedNotes.includes(sourceStr)) {
        combinedNotes = `${sourceStr} | ${combinedNotes}`;
      }
    }

    const leadData: any = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone && String(phone).trim() ? String(phone).trim() : null,
      message: message && String(message).trim() ? String(message).trim() : null,
      projectTitle: projectTitle && String(projectTitle).trim() ? String(projectTitle).trim() : null,
      notes: combinedNotes || null,
    };

    if (projectId && typeof projectId === 'string' && projectId.length > 5) {
      leadData.projectId = projectId;
    }

    if (status) {
      const validStatuses: Record<string, string> = {
        NEW: 'NEW',
        CONTACTED: 'CONTACTED',
        IN_PROGRESS: 'IN_PROGRESS',
        QUALIFIED: 'IN_PROGRESS',
        CLOSED: 'CLOSED',
        CONVERTED: 'CLOSED',
        ARCHIVED: 'ARCHIVED',
      };
      leadData.status = validStatuses[String(status).toUpperCase()] || 'NEW';
    }

    const lead = await prisma.lead.create({
      data: leadData,
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
    if (status) {
      const validStatuses: Record<string, string> = {
        NEW: 'NEW',
        CONTACTED: 'CONTACTED',
        IN_PROGRESS: 'IN_PROGRESS',
        QUALIFIED: 'IN_PROGRESS',
        CLOSED: 'CLOSED',
        CONVERTED: 'CLOSED',
        ARCHIVED: 'ARCHIVED',
      };
      const mapped = validStatuses[String(status).toUpperCase()];
      if (mapped) {
        where.status = mapped;
      }
    }

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

    const data: any = {};
    if (status) {
      const validStatuses: Record<string, string> = {
        NEW: 'NEW',
        CONTACTED: 'CONTACTED',
        IN_PROGRESS: 'IN_PROGRESS',
        QUALIFIED: 'IN_PROGRESS',
        CLOSED: 'CLOSED',
        CONVERTED: 'CLOSED',
        ARCHIVED: 'ARCHIVED',
      };
      data.status = validStatuses[String(status).toUpperCase()] || 'NEW';
    }
    if (notes !== undefined) {
      data.notes = notes;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
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

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { appCache } from '../utils/cache';

// ==========================================
// VALIDATION SCHEMAS
// ==========================================
export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    location: z.string().optional().default(''),
    year: z.string().optional().default(''),
    image: z.string().min(1, 'Cover image is required'),
    description: z.string().optional().default(''),
    highlights: z.array(z.string()).optional().default([]),
    gallery: z.array(z.string()).optional().default([]),
    scope: z.string().nullable().optional(),
    area: z.string().nullable().optional(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional().default('PUBLISHED'),
    featured: z.boolean().optional().default(false),
    order: z.number().int().optional().default(0),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    slug: z.string().optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    year: z.string().optional(),
    image: z.string().optional(),
    description: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    gallery: z.array(z.string()).optional(),
    scope: z.string().nullable().optional(),
    area: z.string().nullable().optional(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
    featured: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ==========================================
// CRUD CONTROLLER HANDLERS
// ==========================================

/**
 * GET /api/admin/projects
 * List projects with pagination, lead count, and caching
 */
export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const category = req.query.category ? String(req.query.category) : undefined;
    const status = req.query.status ? (String(req.query.status).toUpperCase() as any) : undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;

    const cacheKey = `projects:list:${JSON.stringify({ page, limit, category, status, search })}`;
    const cachedData = appCache.get(cacheKey);
    if (cachedData) {
      return sendSuccess(res, cachedData);
    }

    const where: any = {};
    if (category && category !== 'all') where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { leads: true },
          },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    const result = {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };

    appCache.set(cacheKey, result, 60);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/projects/:id
 * Read one project by ID (or slug), including linked leads
 */
export async function getProjectById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const cacheKey = `projects:id:${id}`;

    const cachedProject = appCache.get(cacheKey);
    if (cachedProject) {
      return sendSuccess(res, cachedProject);
    }

    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    appCache.set(cacheKey, project, 60);
    return sendSuccess(res, project);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/projects
 * Create a new project & invalidate cache
 */
export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body;
    let baseSlug = body.slug ? slugify(body.slug) : slugify(body.title);
    if (!baseSlug) baseSlug = `project-${Date.now()}`;

    let slug = baseSlug;
    let count = 1;
    while (await prisma.project.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    const project = await prisma.project.create({
      data: {
        title: body.title,
        slug,
        category: body.category,
        location: body.location || '',
        year: body.year || '',
        image: body.image,
        description: body.description || '',
        highlights: Array.isArray(body.highlights) ? body.highlights : [],
        gallery: Array.isArray(body.gallery) ? body.gallery : [],
        scope: body.scope ?? null,
        area: body.area ?? null,
        status: body.status || 'PUBLISHED',
        featured: Boolean(body.featured),
        order: typeof body.order === 'number' ? body.order : 0,
      },
    });

    appCache.invalidatePrefix('projects:');
    return sendSuccess(res, project, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/admin/projects/:id
 * Update project & invalidate cache
 */
export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const body = req.body;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Project not found', 404);
    }

    if (body.slug && body.slug !== existing.slug) {
      const slugCandidate = slugify(body.slug);
      const duplicate = await prisma.project.findUnique({ where: { slug: slugCandidate } });
      if (duplicate && duplicate.id !== id) {
        return sendError(res, 'Slug already in use by another project', 409);
      }
      body.slug = slugCandidate;
    }

    const project = await prisma.project.update({
      where: { id },
      data: body,
    });

    appCache.invalidatePrefix('projects:');
    return sendSuccess(res, project);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/admin/projects/:id
 * Delete project & invalidate cache
 */
export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Project not found', 404);
    }

    await prisma.project.delete({ where: { id } });

    appCache.invalidatePrefix('projects:');
    return sendSuccess(res, { id, deleted: true });
  } catch (error) {
    next(error);
  }
}
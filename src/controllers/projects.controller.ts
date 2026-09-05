import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { appCache } from '../utils/cache';
import { sendSuccess, sendError } from '../utils/response';

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    slug: z.string().optional(),
    category: z.string().min(2, 'Category is required'),
    location: z.string().optional().default(''),
    year: z.string().optional().default(''),
    image: z.string().min(1, 'Cover image is required'),
    description: z.string().optional().default(''),
    highlights: z.array(z.string()).optional().default([]),
    gallery: z.array(z.string()).optional().default([]),
    scope: z.string().optional().nullable(),
    area: z.string().optional().nullable(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional().default('PUBLISHED'),
    featured: z.boolean().optional().default(false),
    order: z.number().optional().default(0),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    slug: z.string().optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    year: z.string().optional(),
    image: z.string().optional(),
    description: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    gallery: z.array(z.string()).optional(),
    scope: z.string().optional().nullable(),
    area: z.string().optional().nullable(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
    featured: z.boolean().optional(),
    order: z.number().optional(),
  }),
});

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^ws-]/g, '')
    .replace(/[s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * GET /api/projects
 * Cached project list with projection lazy loading & pagination
 */
export async function getProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const category = req.query.category as string;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const includeGallery = req.query.includeGallery === 'true';

    const cacheKey = `projects:list:${JSON.stringify({ page, limit, category, status, search, includeGallery })}`;
    const cachedData = appCache.get(cacheKey);
    if (cachedData) {
      return sendSuccess(res, cachedData, 'Projects fetched from cache');
    }

    const where: any = {};
    if (category && category !== 'all') where.category = category;
    if (status) {
      where.status = status.toUpperCase();
    } else {
      // By default public API serves PUBLISHED projects
      where.status = 'PUBLISHED';
    }

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
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          location: true,
          year: true,
          image: true,
          description: true,
          highlights: true,
          gallery: includeGallery,
          scope: true,
          area: true,
          status: true,
          featured: true,
          order: true,
          createdAt: true,
          updatedAt: true,
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

    appCache.set(cacheKey, result, 60); // 60s TTL
    return sendSuccess(res, result, 'Projects fetched successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id
 * Read one project by ID or unique slug
 */
export async function getProjectById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const cacheKey = `projects:id:${id}`;

    const cachedProject = appCache.get(cacheKey);
    if (cachedProject) {
      return sendSuccess(res, cachedProject, 'Project fetched from cache');
    }

    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            message: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    appCache.set(cacheKey, project, 60);
    return sendSuccess(res, project, 'Project details fetched successfully');
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
    return sendSuccess(res, project, 'Project created successfully', 201);
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
    return sendSuccess(res, project, 'Project updated successfully');
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
    return sendSuccess(res, { id, deleted: true }, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
}

import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

const DEFAULT_CATEGORIES = [
  { label: 'Residential', value: 'residential', order: 1, portfolioPdf: '', description: 'Private residences, luxury villas, and tropical modern homes.' },
  { label: 'Commercial', value: 'commercial', order: 2, portfolioPdf: '', description: 'Corporate headquarters, retail centers, and office spaces.' },
  { label: 'Hospitality', value: 'hospitality', order: 3, portfolioPdf: '', description: 'Luxury resorts, boutique hotels, and dining destinations.' },
  { label: 'Institutional', value: 'institutional', order: 4, portfolioPdf: '', description: 'Educational campuses, convention centers, and civic landmarks.' },
  { label: 'Landscape', value: 'landscape', order: 5, portfolioPdf: '', description: 'Contextual outdoor spaces, ecological courtyards, and botanical integration.' },
  { label: 'Interior', value: 'interior', order: 6, portfolioPdf: '', description: 'Bespoke spatial joinery, lighting schemes, and tactile minimalism.' },
];

export async function getCategories(req: Request, res: Response): Promise<Response> {
  try {
    const isAdmin = req.query.admin === 'true';

    let categories = await (prisma as any).category.findMany({
      where: isAdmin ? undefined : { active: true },
      orderBy: { order: 'asc' },
    });

    if (categories.length === 0) {
      for (const item of DEFAULT_CATEGORIES) {
        await (prisma as any).category.upsert({
          where: { value: item.value },
          update: {},
          create: {
            label: item.label,
            value: item.value,
            order: item.order,
            portfolioPdf: item.portfolioPdf,
            description: item.description,
            active: true,
          },
        });
      }
      categories = await (prisma as any).category.findMany({
        where: isAdmin ? undefined : { active: true },
        orderBy: { order: 'asc' },
      });
    }

    return sendSuccess(res, categories);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch categories', 500);
  }
}

export async function getCategoryById(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const category = await (prisma as any).category.findFirst({
      where: {
        OR: [{ id: String(id) }, { value: String(id).toLowerCase() }],
      },
    });

    if (!category) {
      return sendError(res, 'Category not found', 404);
    }
    return sendSuccess(res, category);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch category', 500);
  }
}

export async function createCategory(req: Request, res: Response): Promise<Response> {
  try {
    const body = req.body;

    if (body.type === 'reorder' && Array.isArray(body.orderedIds)) {
      const updates = body.orderedIds.map((id: string, index: number) =>
        (prisma as any).category.update({
          where: { id: String(id) },
          data: { order: index + 1 },
        })
      );
      await (prisma as any).$transaction(updates);
      const categories = await (prisma as any).category.findMany({ orderBy: { order: 'asc' } });
      return sendSuccess(res, categories, 'Categories reordered successfully');
    }

    const { label, value, portfolioPdf, description, active } = body;
    if (!label) {
      return sendError(res, 'Category label is required', 400);
    }

    const cleanValue = (value || label)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await (prisma as any).category.findUnique({
      where: { value: cleanValue },
    });
    if (existing) {
      return sendError(res, `Category slug "${cleanValue}" already exists`, 400);
    }

    const highest = await (prisma as any).category.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const order = (highest?.order || 0) + 1;

    const newCategory = await (prisma as any).category.create({
      data: {
        label: label.trim(),
        value: cleanValue,
        portfolioPdf: portfolioPdf || '',
        description: description || '',
        order,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return sendSuccess(res, newCategory, 'Category created successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create category', 500);
  }
}

export async function updateCategory(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await (prisma as any).category.findFirst({
      where: {
        OR: [{ id: String(id) }, { value: String(id).toLowerCase() }],
      },
    });

    if (!existing) {
      return sendError(res, 'Category not found', 404);
    }

    if (body.action === 'toggleActive') {
      const updated = await (prisma as any).category.update({
        where: { id: existing.id },
        data: { active: !existing.active },
      });
      return sendSuccess(res, updated, 'Category active status updated');
    }

    const dataToUpdate: any = {};
    if (body.label !== undefined) dataToUpdate.label = body.label.trim();
    if (body.value !== undefined) {
      dataToUpdate.value = body.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    if (body.portfolioPdf !== undefined) dataToUpdate.portfolioPdf = body.portfolioPdf;
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.active !== undefined) dataToUpdate.active = Boolean(body.active);
    if (body.order !== undefined) dataToUpdate.order = Number(body.order);

    const updated = await (prisma as any).category.update({
      where: { id: existing.id },
      data: dataToUpdate,
    });

    return sendSuccess(res, updated, 'Category updated successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update category', 500);
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const existing = await (prisma as any).category.findFirst({
      where: {
        OR: [{ id: String(id) }, { value: String(id).toLowerCase() }],
      },
    });

    if (!existing) {
      return sendError(res, 'Category not found', 404);
    }

    await (prisma as any).category.delete({
      where: { id: existing.id },
    });

    return sendSuccess(res, null, 'Category deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete category', 500);
  }
}

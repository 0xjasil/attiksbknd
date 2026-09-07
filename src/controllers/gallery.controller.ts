import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/gallery (Public & Admin)
export async function getGalleryPosts(req: Request, res: Response): Promise<Response> {
  try {
    const isAdmin = req.query.admin === 'true';

    const posts = await prisma.galleryPost.findMany({
      where: isAdmin ? undefined : { active: true },
      orderBy: { order: 'asc' },
    });

    return sendSuccess(res, posts);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch gallery posts', 500);
  }
}

// POST /api/gallery (Single creation, batch creation, or reordering)
export async function createGalleryPost(req: Request, res: Response): Promise<Response> {
  try {
    const body = req.body;

    // Handle batch reorder
    if (body.type === 'reorder' && Array.isArray(body.orderedIds)) {
      const updates = body.orderedIds.map((id: string, index: number) =>
        prisma.galleryPost.update({
          where: { id: String(id) },
          data: { order: index + 1 },
        })
      );
      await prisma.$transaction(updates);
      const updatedPosts = await prisma.galleryPost.findMany({ orderBy: { order: 'asc' } });
      return sendSuccess(res, updatedPosts, 'Gallery posts reordered successfully');
    }

    // Handle batch creation
    if (body.type === 'batch' || Array.isArray(body.items)) {
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) {
        return sendError(res, 'No items provided for batch creation', 400);
      }

      const highestOrderPost = await prisma.galleryPost.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      const startOrder = (highestOrderPost?.order || 0) + 1;

      const createdList: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.image) continue;
        const created = await prisma.galleryPost.create({
          data: {
            image: item.image,
            caption: item.caption || 'Architectural Highlight',
            altText: item.altText || item.caption || 'Attiks architectural showcase detail',
            description: item.description || '',
            location: item.location || '',
            aspectRatio: item.aspectRatio || 'square',
            active: item.active !== undefined ? Boolean(item.active) : true,
            order: startOrder + i,
          },
        });
        createdList.push(created);
      }

      return sendSuccess(res, createdList, `Created ${createdList.length} gallery posts successfully`, 201);
    }

    // Handle single post creation
    const { image, caption, altText, description, location, aspectRatio, active } = body;
    if (!image) {
      return sendError(res, 'Image URL is required', 400);
    }

    const highestOrderPost = await prisma.galleryPost.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (highestOrderPost?.order || 0) + 1;

    const newPost = await prisma.galleryPost.create({
      data: {
        image,
        caption: caption || 'Architectural Highlight',
        altText: altText || caption || 'Attiks architectural showcase detail',
        description: description || '',
        location: location || '',
        aspectRatio: aspectRatio || 'auto',
        active: active !== undefined ? Boolean(active) : true,
        order: nextOrder,
      },
    });

    return sendSuccess(res, newPost, 'Gallery post created successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create gallery post', 500);
  }
}

// PUT or PATCH /api/gallery/:id (Update post / toggle active)
export async function updateGalleryPost(req: Request, res: Response): Promise<Response> {
  try {
    const id = String(req.params.id);
    const body = req.body;

    const existing = await prisma.galleryPost.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Gallery post not found', 404);
    }

    if (body.action === 'toggleActive') {
      const updated = await prisma.galleryPost.update({
        where: { id },
        data: { active: !existing.active },
      });
      return sendSuccess(res, updated, 'Gallery post status toggled');
    }

    const updated = await prisma.galleryPost.update({
      where: { id },
      data: {
        ...(body.image !== undefined && { image: body.image }),
        ...(body.caption !== undefined && { caption: body.caption }),
        ...(body.altText !== undefined && { altText: body.altText }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.aspectRatio !== undefined && { aspectRatio: body.aspectRatio }),
        ...(body.order !== undefined && { order: Number(body.order) }),
        ...(body.active !== undefined && { active: Boolean(body.active) }),
      },
    });

    return sendSuccess(res, updated, 'Gallery post updated successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update gallery post', 500);
  }
}

// DELETE /api/gallery/:id
export async function deleteGalleryPost(req: Request, res: Response): Promise<Response> {
  try {
    const id = String(req.params.id);

    const existing = await prisma.galleryPost.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Gallery post not found', 404);
    }

    await prisma.galleryPost.delete({ where: { id } });

    // Re-index remaining posts
    const remaining = await prisma.galleryPost.findMany({ orderBy: { order: 'asc' } });
    const updates = remaining.map((p, index) =>
      prisma.galleryPost.update({
        where: { id: p.id },
        data: { order: index + 1 },
      })
    );
    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return sendSuccess(res, { id }, 'Gallery post deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete gallery post', 500);
  }
}

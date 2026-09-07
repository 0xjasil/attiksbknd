import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export const defaultHeroSettings = {
  id: 1,
  autoPlayInterval: 6500,
  showPagination: true,
  showCta: true,
  defaultCtaText: 'view projects',
  defaultCtaLink: '/projects',
};

// GET /api/hero (Public / Admin)
export async function getHero(req: Request, res: Response): Promise<Response> {
  try {
    const isAdmin = req.query.admin === 'true';

    const [slides, settingsRecord] = await Promise.all([
      prisma.heroSlide.findMany({
        where: isAdmin ? undefined : { active: true },
        orderBy: { order: 'asc' },
      }),
      prisma.heroSettings.findUnique({ where: { id: 1 } }),
    ]);

    const settings = settingsRecord || defaultHeroSettings;

    return sendSuccess(res, {
      slides,
      settings,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch hero data', 500);
  }
}

// POST /api/hero (Create slide / handle reorder & settings update)
export async function createHeroOrAction(req: Request, res: Response): Promise<Response> {
  try {
    const body = req.body;

    // Handle batch reorder
    if (body.type === 'reorder' && Array.isArray(body.orderedIds)) {
      const updates = body.orderedIds.map((id: string, index: number) =>
        prisma.heroSlide.update({
          where: { id: String(id) },
          data: { order: index + 1 },
        })
      );
      await prisma.$transaction(updates);
      const updatedSlides = await prisma.heroSlide.findMany({ orderBy: { order: 'asc' } });
      return sendSuccess(res, updatedSlides, 'Hero slides reordered successfully');
    }

    // Handle global settings update
    if (body.type === 'settings' && body.settings) {
      const { autoPlayInterval, showPagination, showCta, defaultCtaText, defaultCtaLink } = body.settings;
      const settings = await prisma.heroSettings.upsert({
        where: { id: 1 },
        update: {
          ...(autoPlayInterval !== undefined && { autoPlayInterval: Number(autoPlayInterval) }),
          ...(showPagination !== undefined && { showPagination: Boolean(showPagination) }),
          ...(showCta !== undefined && { showCta: Boolean(showCta) }),
          ...(defaultCtaText !== undefined && { defaultCtaText: String(defaultCtaText) }),
          ...(defaultCtaLink !== undefined && { defaultCtaLink: String(defaultCtaLink) }),
        },
        create: {
          id: 1,
          autoPlayInterval: autoPlayInterval ? Number(autoPlayInterval) : 6500,
          showPagination: showPagination !== undefined ? Boolean(showPagination) : true,
          showCta: showCta !== undefined ? Boolean(showCta) : true,
          defaultCtaText: defaultCtaText || 'view projects',
          defaultCtaLink: defaultCtaLink || '/projects',
        },
      });
      return sendSuccess(res, settings, 'Hero settings updated successfully');
    }

    // Handle slide creation (Supports WebP, GIF, Images, Videos)
    const { mediaUrl, mediaType, posterUrl, altText, title, subtitle, ctaText, ctaLink, active } = body;

    if (!mediaUrl) {
      return sendError(res, 'Media URL (image, WebP, GIF, or video) is required', 400);
    }

    const detectedMediaType =
      mediaType ||
      (/\.(mp4|webm|mov|mkv)$/i.test(mediaUrl) ? 'video' : 'image');

    const highestOrderSlide = await prisma.heroSlide.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (highestOrderSlide?.order || 0) + 1;

    const newSlide = await prisma.heroSlide.create({
      data: {
        mediaUrl,
        mediaType: detectedMediaType,
        posterUrl: posterUrl || null,
        altText: altText || title || "Architectural project scene by Attiks Architecture",
        title: title || null,
        subtitle: subtitle || null,
        ctaText: ctaText || 'view projects',
        ctaLink: ctaLink || '/projects',
        order: nextOrder,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return sendSuccess(res, newSlide, 'Hero slide created successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to process hero request', 500);
  }
}

// PUT /api/hero/:id (Update slide / toggle active)
export async function updateHeroSlide(req: Request, res: Response): Promise<Response> {
  try {
    const id = String(req.params.id);
    const body = req.body;

    const existingSlide = await prisma.heroSlide.findUnique({ where: { id } });
    if (!existingSlide) {
      return sendError(res, 'Hero slide not found', 404);
    }

    // Toggle active shortcut
    if (body.action === 'toggleActive') {
      const updated = await prisma.heroSlide.update({
        where: { id },
        data: { active: !existingSlide.active },
      });
      return sendSuccess(res, updated, 'Slide active state toggled');
    }

    let detectedMediaType = body.mediaType;
    if (body.mediaUrl && !detectedMediaType) {
      detectedMediaType = /\.(mp4|webm|mov|mkv)$/i.test(body.mediaUrl) ? 'video' : 'image';
    }

    const updatedSlide = await prisma.heroSlide.update({
      where: { id },
      data: {
        ...(body.mediaUrl !== undefined && { mediaUrl: body.mediaUrl }),
        ...(detectedMediaType !== undefined && { mediaType: detectedMediaType }),
        ...(body.posterUrl !== undefined && { posterUrl: body.posterUrl }),
        ...(body.altText !== undefined && { altText: body.altText }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.subtitle !== undefined && { subtitle: body.subtitle }),
        ...(body.ctaText !== undefined && { ctaText: body.ctaText }),
        ...(body.ctaLink !== undefined && { ctaLink: body.ctaLink }),
        ...(body.order !== undefined && { order: Number(body.order) }),
        ...(body.active !== undefined && { active: Boolean(body.active) }),
      },
    });

    return sendSuccess(res, updatedSlide, 'Hero slide updated successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update hero slide', 500);
  }
}

// DELETE /api/hero/:id (Delete slide & re-index)
export async function deleteHeroSlide(req: Request, res: Response): Promise<Response> {
  try {
    const id = String(req.params.id);

    const existing = await prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Hero slide not found', 404);
    }

    await prisma.heroSlide.delete({ where: { id } });

    // Re-index remaining slides
    const remaining = await prisma.heroSlide.findMany({ orderBy: { order: 'asc' } });
    const updates = remaining.map((s, index) =>
      prisma.heroSlide.update({
        where: { id: s.id },
        data: { order: index + 1 },
      })
    );
    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return sendSuccess(res, { id }, 'Hero slide deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to delete hero slide', 500);
  }
}

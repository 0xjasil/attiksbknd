import { Router } from 'express';
import { prisma } from '../config/prisma';
import authRoutes from './auth.routes';
import projectsRoutes from './projects.routes';
import leadsRoutes from './leads.routes';
import testimonialsRoutes from './testimonials.routes';
import heroRoutes from './hero.routes';
import galleryRoutes from './gallery.routes';
import { apiRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Healthcheck & Liveness Probe
router.get('/health', async (req, res) => {
  let dbStatus = 'healthy';
  let latencyMs = 0;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    latencyMs = Date.now() - start;
  } catch (error: any) {
    dbStatus = 'unreachable';
  }

  const isHealthy = dbStatus === 'healthy';
  const memUsage = process.memoryUsage();

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'online' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: `${latencyMs}ms`,
    },
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
    },
    activeResources: ['projects', 'leads', 'testimonials', 'hero', 'gallery', 'users', 'auth'],
  });
});

// Apply general API rate limiter
router.use(apiRateLimiter);

// Auth Routes
router.use('/auth', authRoutes);

// Hero Section Endpoints
router.use('/admin/hero', heroRoutes);
router.use('/hero', heroRoutes);

// Gallery Showcase Endpoints
router.use('/admin/gallery', galleryRoutes);
router.use('/gallery', galleryRoutes);

// Projects Endpoints (Public & Admin)
router.use('/admin/projects', projectsRoutes);
router.use('/projects', projectsRoutes);

// Leads Endpoints (Public Capture & Admin Triage)
router.use('/admin/leads', leadsRoutes);
router.use('/leads', leadsRoutes);

// Testimonials Endpoints
router.use('/admin/testimonials', testimonialsRoutes);
router.use('/testimonials', testimonialsRoutes);

export default router;

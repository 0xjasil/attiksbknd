import { Router } from 'express';
import authRoutes from './auth.routes';
import projectsRoutes from './projects.routes';
import leadsRoutes from './leads.routes';
import testimonialsRoutes from './testimonials.routes';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'online',
      timestamp: new Date().toISOString(),
      service: 'Attiks Architecture Backend API (PostgreSQL + Prisma)',
      activeResources: ['projects', 'leads', 'testimonials', 'users'],
    },
  });
});

// Auth Routes
router.use('/auth', authRoutes);

// Projects Endpoints (Public & Admin)
router.use('/admin/projects', projectsRoutes);
router.use('/projects', projectsRoutes);

// Leads & Testimonials
router.use('/admin/leads', leadsRoutes);
router.use('/leads', leadsRoutes);

router.use('/admin/testimonials', testimonialsRoutes);
router.use('/testimonials', testimonialsRoutes);

export default router;
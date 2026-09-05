import { Router } from 'express';
import { submitLead, getLeads, updateLeadStatus, deleteLead, leadSchema } from '../controllers/leads.controller';
import { validate } from '../middlewares/validate.middleware';
import { leadRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Public Lead Ingestion (Contact form, PDF download, Project inquiry)
router.post('/', leadRateLimiter, validate(leadSchema), submitLead);

// Admin Routes for Leads
router.get('/', getLeads);
router.patch('/:id', updateLeadStatus);
router.patch('/:id/status', updateLeadStatus);
router.put('/:id', updateLeadStatus);
router.delete('/:id', deleteLead);

export default router;

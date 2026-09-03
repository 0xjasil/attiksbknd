import { Router } from 'express';
import { submitLead, getLeads, updateLeadStatus, deleteLead, leadSchema } from '../controllers/leads.controller';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

router.post('/', validate(leadSchema), submitLead);

// Admin Routes for Leads
router.get('/', getLeads);
router.patch('/:id', updateLeadStatus);
router.patch('/:id/status', updateLeadStatus);
router.put('/:id', updateLeadStatus);
router.delete('/:id', deleteLead);

export default router;

import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  createProjectSchema,
  updateProjectSchema,
} from '../controllers/projects.controller';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// Public catalogue listing & item detail
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Admin Mutation Endpoints
router.post('/', validate(createProjectSchema), createProject);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.patch('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

export default router;

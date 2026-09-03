import { Router } from 'express';
import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  createProjectSchema,
  updateProjectSchema,
} from '../controllers/projects.controller';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// CRUD Endpoints for Project
router.get('/', listProjects);
router.get('/:id', getProjectById);
router.post('/', validate(createProjectSchema), createProject);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

export default router;

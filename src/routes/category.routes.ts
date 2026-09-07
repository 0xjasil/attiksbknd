import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Public: list categories
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin-protected: create, update, delete
router.post('/', requireAuth, createCategory);
router.put('/:id', requireAuth, updateCategory);
router.patch('/:id', requireAuth, updateCategory);
router.delete('/:id', requireAuth, deleteCategory);

export default router;

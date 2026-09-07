import { Router } from 'express';
import {
  getGalleryPosts,
  createGalleryPost,
  updateGalleryPost,
  deleteGalleryPost,
} from '../controllers/gallery.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Public / Admin fetch
router.get('/', getGalleryPosts);

// Protected mutation endpoints
router.post('/', requireAuth, createGalleryPost);
router.put('/:id', requireAuth, updateGalleryPost);
router.patch('/:id', requireAuth, updateGalleryPost);
router.delete('/:id', requireAuth, deleteGalleryPost);

export default router;

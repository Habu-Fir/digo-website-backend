// src/routes/article.routes.ts
import { Router } from 'express';
import { protect, optionalAuth, canManageCategory } from '../middleware/auth.js';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  togglePublish,
  getCategoryFromBody,
} from '../controllers/article.controller.js';

const router = Router();

// Public reads — optionalAuth lets logged-in staff also see unpublished posts
router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPost);

router.post('/', protect, canManageCategory(getCategoryFromBody), createPost);
router.put('/:id', protect, canManageCategory(getCategoryFromBody), updatePost);
router.delete('/:id', protect, canManageCategory(getCategoryFromBody), deletePost);
router.patch('/:id/publish', protect, canManageCategory(getCategoryFromBody), togglePublish);

export default router;

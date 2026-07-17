// backend/src/routes/post.routes.ts
import { Router } from 'express';
import { protect, authorize, canManageCategory } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import {
    getPosts,
    getPostById,
    getPostsByCategory,
    createPost,
    updatePost,
    deletePost,
    togglePublishPost,
} from '../controllers/post.controller.js';

const router = Router();

// ===============================
// PUBLIC ROUTES
// ===============================
router.get('/', getPosts);
router.get('/category/:category', getPostsByCategory);
router.get('/:id', getPostById);

// ===============================
// PROTECTED ROUTES
// ===============================
// Create post - user must have permission for the category
router.post('/', protect, uploadSingle, createPost);

// Update post - user must have permission for the category
router.put('/:id', protect, uploadSingle, updatePost);

// Toggle publish status
router.patch('/:id/toggle-publish', protect, togglePublishPost);

// Delete post - user must have permission for the category
router.delete('/:id', protect, deletePost);

export default router;
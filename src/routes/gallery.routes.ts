// backend/src/routes/gallery.routes.ts
import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import {
  getGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  toggleFeatured,
} from '../controllers/gallery.controller.js';

const router = Router();

// Public routes
router.get('/', getGalleryItems);
router.get('/:id', getGalleryItemById);

// Protected routes
router.post('/', protect, uploadSingle, createGalleryItem);
router.put('/:id', protect, uploadSingle, updateGalleryItem);
router.patch('/:id/toggle-featured', protect, toggleFeatured);
router.delete('/:id', protect, deleteGalleryItem);

export default router;
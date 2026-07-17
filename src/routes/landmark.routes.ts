// src/routes/landmark.routes.ts
import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getLandmarks,
  getLandmark,
  createLandmark,
  updateLandmark,
  deleteLandmark,
} from '../controllers/landmark.controller.js';

const router = Router();

router.get('/', getLandmarks);
router.get('/:id', getLandmark);

router.post('/', protect, authorize('super_admin'), createLandmark);
router.put('/:id', protect, authorize('super_admin'), updateLandmark);
router.delete('/:id', protect, authorize('super_admin'), deleteLandmark);

export default router;

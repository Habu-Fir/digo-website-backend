// src/routes/event.routes.ts
import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/event.controller.js';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEvent);

router.post('/', protect, authorize('super_admin'), createEvent);
router.put('/:id', protect, authorize('super_admin'), updateEvent);
router.delete('/:id', protect, authorize('super_admin'), deleteEvent);

export default router;

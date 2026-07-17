// src/routes/investment.routes.ts
import { Router } from 'express';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import {
  createInvestment,
  getInvestments,
  getInvestment,
  updateInvestment,
  deleteInvestment,
  getInvestmentStats,
} from '../controllers/investment.controller.js';

const router = Router();

// Public: anyone can submit an investment proposal
router.post('/', optionalAuth, createInvestment);

// Admin-only: review, manage, and analyze proposals
router.get('/stats', protect, authorize('super_admin'), getInvestmentStats);
router.get('/', protect, authorize('super_admin'), getInvestments);
router.get('/:id', protect, authorize('super_admin'), getInvestment);
router.put('/:id', protect, authorize('super_admin'), updateInvestment);
router.delete('/:id', protect, authorize('super_admin'), deleteInvestment);

export default router;

// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  register,
  login,
  getMe,
  getUsers,
  updateUser,
  deleteUser,
  getDashboardStats,
  changePassword,  // ← Add this import
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);

router.use(protect); // everything below requires authentication

router.get('/me', getMe);
router.post('/change-password', changePassword);  // ← Add this


// ===============================
// DASHBOARD STATS - SUPER ADMIN ONLY
// ===============================
router.get('/dashboard/stats', authorize('super_admin'), getDashboardStats);

// ===============================
// USER MANAGEMENT - SUPER ADMIN ONLY
// ===============================
router.post('/register', authorize('super_admin'), register);
router.get('/users', authorize('super_admin'), getUsers);
router.put('/users/:id', authorize('super_admin'), updateUser);
router.delete('/users/:id', authorize('super_admin'), deleteUser);

export default router;
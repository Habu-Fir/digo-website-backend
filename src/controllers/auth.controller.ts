// backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { AppErrorClass } from '../middleware/errorHandler.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import generateToken from '../utils/generateToken.js';
import {
  LoginRequest,
  RegisterRequest,
  UpdateUserRequest,
  AuthResponse,
  IUser,
} from '../types/index.js';

const sendAuthResponse = (user: InstanceType<typeof User>, statusCode: number, res: Response) => {
  const token = generateToken(user._id.toString());

  const payload: AuthResponse = {
    success: true,
    token,
    data: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      permissions: user.permissions,
      createdAt: user.createdAt.toISOString(),
    },
  };

  res.status(statusCode).json(payload);
};

// @desc    Register a new admin/staff account
// @route   POST /api/auth/register
// @access  Private (Super Admin only)
// backend/src/controllers/auth.controller.ts - Update register function

// @desc    Register a new user (Super Admin only)
// @route   POST /api/auth/register
// @access  Private (Super Admin only)
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, role, department } = req.body as RegisterRequest;

  if (!name || !email) {
    throw new AppErrorClass('Name and email are required.', 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppErrorClass('A user with this email already exists.', 400);
  }

  // Generate temporary password
  const tempPassword = generateTemporaryPassword();

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: tempPassword,
    role: role || 'viewer',
    department,
    isTemporaryPassword: true,
    mustChangePassword: true,
  });

  // Send email with temporary password (implement this)
  // await sendWelcomeEmail(user.email, tempPassword, user.name);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      temporaryPassword: tempPassword, // Send temp password in response
    },
  });
});

// Helper to generate temporary password
const generateTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// @desc    Log in
// @route   POST /api/auth/login
// @access  Public
// backend/src/controllers/auth.controller.ts - Update login function

// backend/src/controllers/auth.controller.ts
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginRequest;

  if (!email || !password) {
    throw new AppErrorClass('Please provide both email and password.', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new AppErrorClass('Invalid credentials.', 401);
  }

  if (!user.isActive) {
    throw new AppErrorClass('This account has been deactivated. Contact a Super Admin.', 403);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new AppErrorClass('Invalid credentials.', 401);
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id.toString());

  res.status(200).json({
    success: true,
    token,
    data: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      permissions: user.permissions,
      mustChangePassword: user.mustChangePassword || false,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

// backend/src/controllers/auth.controller.ts - Add this function

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user as IUser;

  if (!currentPassword || !newPassword) {
    throw new AppErrorClass('Please provide current and new password.', 400);
  }

  if (newPassword.length < 6) {
    throw new AppErrorClass('New password must be at least 6 characters.', 400);
  }

  // Get user with password
  const fullUser = await User.findById(user._id).select('+password');
  if (!fullUser) {
    throw new AppErrorClass('User not found.', 404);
  }

  // Verify current password
  const isMatch = await fullUser.matchPassword(currentPassword);
  if (!isMatch) {
    throw new AppErrorClass('Current password is incorrect.', 401);
  }

  // Update password
  fullUser.password = newPassword;
  fullUser.mustChangePassword = false;
  fullUser.isTemporaryPassword = false;
  fullUser.passwordChangedAt = new Date();
  await fullUser.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id);
  res.status(200).json({ success: true, data: user });
});

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private (Super Admin only)
export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: users.length, data: users });
});

// @desc    Update a user
// @route   PUT /api/auth/users/:id
// @access  Private (Super Admin only)
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body as UpdateUserRequest;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppErrorClass('User not found.', 404);
  }

  if (updates.name !== undefined) user.name = updates.name;
  if (updates.email !== undefined) user.email = updates.email;
  if (updates.role !== undefined) user.role = updates.role;
  if (updates.department !== undefined) user.department = updates.department;
  if (updates.isActive !== undefined) user.isActive = updates.isActive;
  if (updates.password) user.password = updates.password;

  await user.save();

  res.status(200).json({ success: true, data: user });
});

// @desc    Delete a user
// @route   DELETE /api/auth/users/:id
// @access  Private (Super Admin only)
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.params.id === req.user!._id.toString()) {
    throw new AppErrorClass('You cannot delete your own account.', 400);
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new AppErrorClass('User not found.', 404);
  }

  res.status(200).json({ success: true, message: 'User deleted successfully.' });
});

// ===============================
// @desc    Get dashboard statistics
// @route   GET /api/auth/dashboard/stats
// @access  Private (Super Admin only)
// ===============================
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();

    // Get total posts
    const totalPosts = await Post.countDocuments();

    // Get pending posts
    const pendingPosts = await Post.countDocuments({ isPublished: false });

    // ===============================
    // FIX: Get posts by category - Use type assertion
    // ===============================
    const categories = ['news', 'history', 'entertainment', 'health', 'technology', 'vacancy', 'gallery'];
    const postsByCategory: Record<string, number> = {};

    for (const cat of categories) {
      // Use type assertion to fix the TypeScript error
      postsByCategory[cat] = await Post.countDocuments({
        category: cat as any
      });
    }

    // Get total views
    const posts = await Post.find().select('views');
    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);

    // Get recent activity (last 10 posts)
    const recentPosts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('publishedBy', 'name');

    const recentActivity = recentPosts.map((post) => ({
      user: (post.publishedBy as any)?.name || 'Unknown',
      action: `Published "${post.title}"`,
      timestamp: post.createdAt,
    }));

    const stats = {
      totalPosts,
      totalUsers,
      totalViews,
      pendingPosts,
      postsByCategory,
      recentActivity,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default stats if error
    res.status(200).json({
      success: true,
      data: {
        totalPosts: 0,
        totalUsers: 0,
        totalViews: 0,
        pendingPosts: 0,
        postsByCategory: {
          news: 0,
          history: 0,
          entertainment: 0,
          health: 0,
          technology: 0,
          vacancy: 0,
          gallery: 0,
        },
        recentActivity: [],
      },
    });
  }
});
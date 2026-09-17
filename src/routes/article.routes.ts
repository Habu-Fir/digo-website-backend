// src/routes/article.routes.ts

import { Router } from 'express';

import {
  protect,
  optionalAuth,
  canManageCategory,
} from '../middleware/auth.js';

import {
  uploadSingle,
} from '../middleware/upload.js';

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


// ============================================================
// PUBLIC READ ROUTES
// ============================================================

// Get articles
//
// Example:
// GET /api/articles
// GET /api/articles?category=news
// GET /api/articles?published=true
// GET /api/articles?search=technology
// GET /api/articles?page=1&limit=10

router.get(
  '/',
  optionalAuth,
  getPosts
);


// Get single article
//
// Example:
// GET /api/articles/6aa6f090a30bc41a81c94670

router.get(
  '/:id',
  optionalAuth,
  getPost
);


// ============================================================
// PROTECTED CREATE ROUTE
// ============================================================

// Create article with optional image
//
// FormData:
// - data = JSON string containing article data
// - image = image file

router.post(
  '/',
  protect,
  uploadSingle,
  canManageCategory(
    getCategoryFromBody
  ),
  createPost
);


// ============================================================
// PROTECTED UPDATE ROUTE
// ============================================================

// Update article with optional new image
//
// FormData:
// - data = JSON string containing updated article data
// - image = new image file (optional)

router.put(
  '/:id',
  protect,
  uploadSingle,
  canManageCategory(
    getCategoryFromBody
  ),
  updatePost
);


// ============================================================
// PROTECTED DELETE ROUTE
// ============================================================

router.delete(
  '/:id',
  protect,
  canManageCategory(
    getCategoryFromBody
  ),
  deletePost
);


// ============================================================
// PROTECTED PUBLISH / UNPUBLISH ROUTE
// ============================================================

router.patch(
  '/:id/publish',
  protect,
  canManageCategory(
    getCategoryFromBody
  ),
  togglePublish
);


export default router;
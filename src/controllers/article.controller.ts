// src/controllers/article.controller.ts
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { AppErrorClass } from '../middleware/errorHandler.js';
import Post from '../models/Post.js';
import { CreatePostRequest, UpdatePostRequest, PostCategory } from '../types/index.js';

// @desc    Get posts (optionally filtered by category, published state, search, pagination)
// @route   GET /api/articles?category=news&published=true&search=term&page=1&limit=10
// @access  Public (unpublished posts only visible to authenticated staff)
export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const { category, search, published } = req.query as Record<string, string>;
  const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
  const limit = Math.min(parseInt((req.query.limit as string) || '10', 10), 100);

  const filter: Record<string, unknown> = {};

  if (category) filter.category = category;

  // Public visitors only ever see published content
  if (!req.user) {
    filter.isPublished = true;
  } else if (published !== undefined) {
    filter.isPublished = published === 'true';
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const total = await Post.countDocuments(filter);

  const posts = await Post.find(filter)
    .populate('publishedBy', 'name email role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: posts.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    data: posts,
  });
});

// @desc    Get a single post by id (increments view count)
// @route   GET /api/articles/:id
// @access  Public (unpublished posts only visible to authenticated staff)
export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id).populate('publishedBy', 'name email role');

  if (!post) {
    throw new AppErrorClass('Post not found.', 404);
  }

  if (!post.isPublished && !req.user) {
    throw new AppErrorClass('Post not found.', 404);
  }

  post.views += 1;
  await post.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: post });
});

// @desc    Create a post
// @route   POST /api/articles
// @access  Private (role must manage the target category)
export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreatePostRequest;

  if (!body.title || !body.content || !body.category || !body.author) {
    throw new AppErrorClass('Title, content, category, and author are required.', 400);
  }

  const post = await Post.create({
    ...body,
    publishedBy: req.user!._id,
  });

  res.status(201).json({ success: true, data: post });
});

// @desc    Update a post
// @route   PUT /api/articles/:id
// @access  Private (role must manage the post's category)
export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body as UpdatePostRequest;

  const post = await Post.findById(req.params.id);
  if (!post) {
    throw new AppErrorClass('Post not found.', 404);
  }

  Object.assign(post, updates);
  await post.save();

  res.status(200).json({ success: true, data: post });
});

// @desc    Delete a post
// @route   DELETE /api/articles/:id
// @access  Private (role must manage the post's category)
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) {
    throw new AppErrorClass('Post not found.', 404);
  }

  res.status(200).json({ success: true, message: 'Post deleted successfully.' });
});

// @desc    Publish or unpublish a post
// @route   PATCH /api/articles/:id/publish
// @access  Private (role must manage the post's category)
export const togglePublish = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    throw new AppErrorClass('Post not found.', 404);
  }

  post.isPublished = !post.isPublished;
  await post.save();

  res.status(200).json({ success: true, data: post });
});

// @desc    Get post category for the canManageCategory middleware
// Used as: canManageCategory(getCategoryFromParams)
export const getCategoryFromBody = (req: Request): PostCategory => {
  return req.body.category as PostCategory;
};

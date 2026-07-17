// backend/src/controllers/post.controller.ts
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { AppErrorClass } from '../middleware/errorHandler.js';
import Post from '../models/Post.js';
import { IUser, PostCategory } from '../types/index.js';
import { AuthRequest } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

// ===============================
// HELPER: Check if user can post to category
// ===============================
const canUserPostToCategory = (userRole: string | undefined, category: string): boolean => {
    if (userRole === 'super_admin') return true;

    const roleCategoryMap: Record<string, string[]> = {
        news_admin: ['news'],
        history_admin: ['history'],
        entertainment_admin: ['entertainment'],
        health_admin: ['health'],
        technology_admin: ['technology'],
        vacancy_admin: ['vacancy'],
        gallery_admin: ['gallery'],
    };

    const allowedCategories = roleCategoryMap[userRole || ''] || [];
    return allowedCategories.includes(category);
};

// ===============================
// GET ALL POSTS
// ===============================
export const getPosts = asyncHandler(async (req: Request, res: Response) => {
    const { category, search, page = 1, limit = 20, isPublished } = req.query;

    const query: any = {};

    if (category && category !== 'all') {
        query.category = category as string;
    }

    if (isPublished !== undefined) {
        query.isPublished = isPublished === 'true';
    }

    if (search) {
        query.$text = { $search: search as string };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('publishedBy', 'name email role');

    const total = await Post.countDocuments(query);

    res.status(200).json({
        success: true,
        count: posts.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        data: posts,
    });
});

// ===============================
// GET POST BY ID
// ===============================
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
    const post = await Post.findById(req.params.id).populate('publishedBy', 'name email role');

    if (!post) {
        throw new AppErrorClass('Post not found', 404);
    }

    post.views += 1;
    await post.save();

    res.status(200).json({
        success: true,
        data: post,
    });
});

// ===============================
// GET POSTS BY CATEGORY
// ===============================
export const getPostsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params;
    const { limit = 20 } = req.query;

    const validCategories: PostCategory[] = [
        'news', 'history', 'entertainment', 'health',
        'technology', 'vacancy', 'gallery'
    ];

    if (!validCategories.includes(category as PostCategory)) {
        throw new AppErrorClass('Invalid category', 400);
    }

    const posts = await Post.find({ category: category as any })
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .populate('publishedBy', 'name email role');

    res.status(200).json({
        success: true,
        count: posts.length,
        data: posts,
    });
});

// ===============================
// CREATE POST - WITH IMAGE UPLOAD FIX
// ===============================
export const createPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log('📝 Creating post...');

    const user = req.user as IUser;
    if (!user) {
        throw new AppErrorClass('User not authenticated', 401);
    }

    // Parse data from FormData
    let postData: any = req.body;
    if (req.body.data) {
        try {
            postData = JSON.parse(req.body.data);
            console.log('📝 Parsed post data:', postData);
        } catch (e) {
            throw new AppErrorClass('Invalid data format', 400);
        }
    }

    // Handle file upload - FIXED
    const file = (req as any).file;
    if (file) {
        console.log('📁 File uploaded:', {
            originalname: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
        });

        // ✅ FIX: Store only the filename
        const filename = path.basename(file.path);
        postData.imagePath = file.path;
        postData.imageUrl = `/uploads/${filename}`;
        console.log('📸 Image URL:', postData.imageUrl);
    }

    // Set published by
    postData.publishedBy = user._id;

    // Validate required fields
    if (!postData.title || !postData.content || !postData.author) {
        // Clean up uploaded file if validation fails
        if (file && file.path) {
            fs.unlink(file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        throw new AppErrorClass('Title, content, and author are required', 400);
    }

    // Check category permission
    const userRole = user.role;
    const category = postData.category;
    if (!canUserPostToCategory(userRole, category)) {
        // Clean up uploaded file if permission fails
        if (file && file.path) {
            fs.unlink(file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        throw new AppErrorClass(
            `You don't have permission to post in ${category} category`,
            403
        );
    }

    const post = await Post.create(postData);
    console.log('✅ Post created:', post._id);

    res.status(201).json({
        success: true,
        data: post,
    });
});

// ===============================
// UPDATE POST - WITH IMAGE UPLOAD FIX
// ===============================
export const updatePost = asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log('📝 Updating post:', req.params.id);

    const post = await Post.findById(req.params.id);

    if (!post) {
        throw new AppErrorClass('Post not found', 404);
    }

    // Parse data from FormData
    let updateData: any = req.body;
    if (req.body.data) {
        try {
            updateData = JSON.parse(req.body.data);
            console.log('📝 Parsed update data:', updateData);
        } catch (e) {
            throw new AppErrorClass('Invalid data format', 400);
        }
    }

    // Handle file upload - FIXED
    const file = (req as any).file;
    if (file) {
        console.log('📁 New file uploaded:', file.originalname);

        // Delete old image if exists
        if (post.imagePath && fs.existsSync(post.imagePath)) {
            fs.unlink(post.imagePath, (err) => {
                if (err) console.error('Error deleting old file:', err);
                else console.log('🗑️ Deleted old image:', post.imagePath);
            });
        }

        // ✅ FIX: Store only the filename
        const filename = path.basename(file.path);
        updateData.imagePath = file.path;
        updateData.imageUrl = `/uploads/${filename}`;
        console.log('📸 Updated Image URL:', updateData.imageUrl);
    }

    const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    ).populate('publishedBy', 'name email role');

    console.log('✅ Post updated:', updatedPost?._id);

    res.status(200).json({
        success: true,
        data: updatedPost,
    });
});

// ===============================
// TOGGLE PUBLISH STATUS
// ===============================
export const togglePublishPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        throw new AppErrorClass('Post not found', 404);
    }

    post.isPublished = !post.isPublished;
    if (post.isPublished) {
        post.publishedAt = new Date();
    }
    await post.save();

    res.status(200).json({
        success: true,
        data: post,
    });
});

// ===============================
// DELETE POST
// ===============================
export const deletePost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        throw new AppErrorClass('Post not found', 404);
    }

    // Delete associated image
    if (post.imagePath && fs.existsSync(post.imagePath)) {
        fs.unlink(post.imagePath, (err) => {
            if (err) console.error('Error deleting file:', err);
            else console.log('🗑️ Deleted image:', post.imagePath);
        });
    }

    await post.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Post deleted successfully',
    });
});

// ===============================
// GET POST STATS
// ===============================
export const getPostStats = asyncHandler(async (req: Request, res: Response) => {
    const categories = ['news', 'history', 'entertainment', 'health', 'technology', 'vacancy', 'gallery'];
    const stats: Record<string, number> = {};

    for (const cat of categories) {
        stats[cat] = await Post.countDocuments({ category: cat as any });
    }

    const total = await Post.countDocuments();
    const published = await Post.countDocuments({ isPublished: true });
    const drafts = await Post.countDocuments({ isPublished: false });

    res.status(200).json({
        success: true,
        data: {
            total,
            published,
            drafts,
            byCategory: stats,
        },
    });
});
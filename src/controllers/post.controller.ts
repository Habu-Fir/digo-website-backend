// backend/src/controllers/post.controller.ts

import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { AppErrorClass } from '../middleware/errorHandler.js';
import Post from '../models/Post.js';
import { IUser, PostCategory } from '../types/index.js';
import { AuthRequest } from '../middleware/auth.js';

import cloudinary from '../config/cloudinary.js';
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';

// ===============================
// HELPER: Check if user can post to category
// ===============================

const canUserPostToCategory = (
    userRole: string | undefined,
    category: string
): boolean => {
    // Super admin can post to every category
    if (userRole === 'super_admin') {
        return true;
    }

    const roleCategoryMap: Record<string, string[]> = {
        news_admin: ['news'],
        history_admin: ['history'],
        entertainment_admin: ['entertainment'],
        health_admin: ['health'],
        technology_admin: ['technology'],
        vacancy_admin: ['vacancy'],
        gallery_admin: ['gallery'],
    };

    const allowedCategories =
        roleCategoryMap[userRole || ''] || [];

    return allowedCategories.includes(category);
};

// ===============================
// HELPER: Check if image is stored
// on Cloudinary
// ===============================

const isCloudinaryImage = (
    imageUrl?: string
): boolean => {
    return (
        typeof imageUrl === 'string' &&
        imageUrl.startsWith(
            'https://res.cloudinary.com/'
        )
    );
};

// ===============================
// HELPER: Delete Cloudinary image
// ===============================

const deleteCloudinaryImage = async (
    imageUrl?: string,
    publicId?: string
): Promise<void> => {
    // Do nothing if this is an old/local image
    if (
        !isCloudinaryImage(imageUrl) ||
        !publicId
    ) {
        return;
    }

    try {
        console.log(
            '🗑️ Deleting Cloudinary image:',
            publicId
        );

        const result =
            await cloudinary.uploader.destroy(
                publicId,
                {
                    resource_type: 'image',
                }
            );

        console.log(
            '✅ Cloudinary delete result:',
            result.result
        );
    } catch (error) {
        // Don't stop the main operation if
        // Cloudinary deletion fails.
        console.error(
            '⚠️ Failed to delete Cloudinary image:',
            error
        );
    }
};

// ===============================
// GET ALL POSTS
// ===============================

export const getPosts = asyncHandler(
    async (req: Request, res: Response) => {
        const {
            category,
            search,
            page = 1,
            limit = 20,
            isPublished,
        } = req.query;

        const query: any = {};

        // Filter by category
        if (
            category &&
            category !== 'all'
        ) {
            query.category = category as string;
        }

        // Filter by published status
        if (isPublished !== undefined) {
            query.isPublished =
                isPublished === 'true';
        }

        // Search
        if (search) {
            query.$text = {
                $search: search as string,
            };
        }

        // Pagination
        const skip =
            (Number(page) - 1) *
            Number(limit);

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate(
                'publishedBy',
                'name email role'
            );

        const total =
            await Post.countDocuments(query);

        res.status(200).json({
            success: true,
            count: posts.length,
            total,
            pages: Math.ceil(
                total / Number(limit)
            ),
            currentPage: Number(page),
            data: posts,
        });
    }
);

// ===============================
// GET POST BY ID
// ===============================

export const getPostById = asyncHandler(
    async (req: Request, res: Response) => {
        const post =
            await Post.findById(
                req.params.id
            ).populate(
                'publishedBy',
                'name email role'
            );

        if (!post) {
            throw new AppErrorClass(
                'Post not found',
                404
            );
        }

        // Increase view count
        post.views += 1;

        await post.save();

        res.status(200).json({
            success: true,
            data: post,
        });
    }
);

// ===============================
// GET POSTS BY CATEGORY
// ===============================

export const getPostsByCategory =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const { category } =
                req.params;

            const {
                limit = 20,
            } = req.query;

            const validCategories:
                PostCategory[] = [
                    'news',
                    'history',
                    'entertainment',
                    'health',
                    'technology',
                    'vacancy',
                    'gallery',
                ];

            if (
                !validCategories.includes(
                    category as PostCategory
                )
            ) {
                throw new AppErrorClass(
                    'Invalid category',
                    400
                );
            }

            const posts =
                await Post.find({
                    category:
                        category as any,
                })
                    .sort({
                        createdAt: -1,
                    })
                    .limit(
                        Number(limit)
                    )
                    .populate(
                        'publishedBy',
                        'name email role'
                    );

            res.status(200).json({
                success: true,
                count: posts.length,
                data: posts,
            });
        }
    );

// ===============================
// CREATE POST
// WITH CLOUDINARY IMAGE UPLOAD
// ===============================

export const createPost = asyncHandler(
    async (
        req: AuthRequest,
        res: Response
    ) => {
        console.log(
            '📝 Creating post...'
        );

        // ==========================================
        // GET AUTHENTICATED USER
        // ==========================================

        const user =
            req.user as IUser;

        if (!user) {
            throw new AppErrorClass(
                'User not authenticated',
                401
            );
        }

        // ==========================================
        // PARSE DATA FROM FORMDATA
        // ==========================================

        let postData: any = req.body;

        if (req.body.data) {
            try {
                postData =
                    JSON.parse(
                        req.body.data
                    );

                console.log(
                    '📝 Parsed post data:',
                    postData
                );
            } catch (error) {
                console.error(
                    '❌ Failed to parse post data:',
                    error
                );

                throw new AppErrorClass(
                    'Invalid data format',
                    400
                );
            }
        }

        // ==========================================
        // VALIDATE REQUIRED FIELDS
        // ==========================================

        if (
            !postData.title ||
            !postData.content ||
            !postData.author
        ) {
            throw new AppErrorClass(
                'Title, content, and author are required',
                400
            );
        }

        // ==========================================
        // CHECK CATEGORY PERMISSION
        // ==========================================

        const userRole =
            user.role;

        const category =
            postData.category;

        if (
            !canUserPostToCategory(
                userRole,
                category
            )
        ) {
            throw new AppErrorClass(
                `You don't have permission to post in ${category} category`,
                403
            );
        }

        // ==========================================
        // SET PUBLISHED BY
        // ==========================================

        postData.publishedBy =
            user._id;

        // ==========================================
        // GET UPLOADED FILE
        // ==========================================

        const file = req.file;

        let uploadedPublicId:
            | string
            | undefined;

        if (file) {
            console.log(
                '📁 File received:',
                {
                    originalname:
                        file.originalname,
                    size: file.size,
                    mimetype:
                        file.mimetype,
                }
            );

            try {
                // ==========================================
                // UPLOAD IMAGE TO CLOUDINARY
                // ==========================================

                console.log(
                    '☁️ Uploading image to Cloudinary...'
                );

                const result =
                    await uploadToCloudinary(
                        file,
                        'digo/articles'
                    );

                uploadedPublicId =
                    result.public_id;

                // ==========================================
                // STORE CLOUDINARY INFORMATION
                // ==========================================

                postData.imageUrl =
                    result.secure_url;

                // Store Cloudinary public_id.
                // Used later when deleting/replacing
                // the image.
                postData.imagePath =
                    result.public_id;

                console.log(
                    '✅ Cloudinary upload successful'
                );

                console.log(
                    '📸 Image URL:',
                    result.secure_url
                );

                console.log(
                    '🆔 Image public ID:',
                    result.public_id
                );
            } catch (error) {
                console.error(
                    '❌ Cloudinary upload failed:',
                    error
                );

                throw new AppErrorClass(
                    'Failed to upload image',
                    500
                );
            }
        }

        // ==========================================
        // CREATE POST
        // ==========================================

        try {
            const post =
                await Post.create(
                    postData
                );

            console.log(
                '✅ Post created:',
                post._id
            );

            // ==========================================
            // RESPONSE
            // ==========================================

            res.status(201).json({
                success: true,
                data: post,
            });
        } catch (error) {
            // ==========================================
            // CLEANUP CLOUDINARY IMAGE
            // IF DATABASE CREATION FAILS
            // ==========================================

            if (uploadedPublicId) {
                await deleteCloudinaryImage(
                    postData.imageUrl,
                    uploadedPublicId
                );
            }

            throw error;
        }
    }
);

// ===============================
// UPDATE POST
// WITH CLOUDINARY IMAGE UPLOAD
// ===============================

export const updatePost = asyncHandler(
    async (
        req: AuthRequest,
        res: Response
    ) => {
        console.log(
            '📝 Updating post:',
            req.params.id
        );

        // ==========================================
        // FIND EXISTING POST
        // ==========================================

        const post =
            await Post.findById(
                req.params.id
            );

        if (!post) {
            throw new AppErrorClass(
                'Post not found',
                404
            );
        }

        // ==========================================
        // GET AUTHENTICATED USER
        // ==========================================

        const user =
            req.user as IUser;

        if (!user) {
            throw new AppErrorClass(
                'User not authenticated',
                401
            );
        }

        // ==========================================
        // PARSE DATA FROM FORMDATA
        // ==========================================

        let updateData: any =
            req.body;

        if (req.body.data) {
            try {
                updateData =
                    JSON.parse(
                        req.body.data
                    );

                console.log(
                    '📝 Parsed update data:',
                    updateData
                );
            } catch (error) {
                console.error(
                    '❌ Failed to parse update data:',
                    error
                );

                throw new AppErrorClass(
                    'Invalid data format',
                    400
                );
            }
        }

        // ==========================================
        // CHECK CATEGORY PERMISSION
        // ==========================================

        const category =
            updateData.category ??
            post.category;

        if (
            !canUserPostToCategory(
                user.role,
                category
            )
        ) {
            throw new AppErrorClass(
                `You don't have permission to post in ${category} category`,
                403
            );
        }

        // ==========================================
        // GET NEW FILE
        // ==========================================

        const file = req.file;

        let newPublicId:
            | string
            | undefined;

        let newImageUrl:
            | string
            | undefined;

        // Save old image information
        // before replacing it.
        const oldImageUrl =
            post.imageUrl;

        const oldImagePath =
            post.imagePath;

        // ==========================================
        // UPLOAD NEW IMAGE
        // ==========================================

        if (file) {
            console.log(
                '📁 New file uploaded:',
                file.originalname
            );

            try {
                console.log(
                    '☁️ Uploading new image to Cloudinary...'
                );

                const result =
                    await uploadToCloudinary(
                        file,
                        'digo/articles'
                    );

                newPublicId =
                    result.public_id;

                newImageUrl =
                    result.secure_url;

                console.log(
                    '✅ New image uploaded successfully'
                );

                console.log(
                    '📸 New image URL:',
                    newImageUrl
                );

                console.log(
                    '🆔 New image public ID:',
                    newPublicId
                );

                // ==========================================
                // STORE NEW CLOUDINARY INFORMATION
                // ==========================================

                updateData.imageUrl =
                    newImageUrl;

                updateData.imagePath =
                    newPublicId;
            } catch (error) {
                console.error(
                    '❌ Cloudinary upload failed:',
                    error
                );

                throw new AppErrorClass(
                    'Failed to upload new image',
                    500
                );
            }
        }

        // ==========================================
        // UPDATE DATABASE
        // ==========================================

        let updatedPost;

        try {
            updatedPost =
                await Post.findByIdAndUpdate(
                    req.params.id,
                    updateData,
                    {
                        new: true,
                        runValidators: true,
                    }
                ).populate(
                    'publishedBy',
                    'name email role'
                );
        } catch (error) {
            // ==========================================
            // CLEANUP NEW IMAGE IF DATABASE UPDATE FAILS
            // ==========================================

            if (
                newPublicId &&
                newImageUrl
            ) {
                await deleteCloudinaryImage(
                    newImageUrl,
                    newPublicId
                );
            }

            throw error;
        }

        // ==========================================
        // VERIFY UPDATE
        // ==========================================

        if (!updatedPost) {
            // Delete newly uploaded image
            // if post update somehow failed.
            if (
                newPublicId &&
                newImageUrl
            ) {
                await deleteCloudinaryImage(
                    newImageUrl,
                    newPublicId
                );
            }

            throw new AppErrorClass(
                'Failed to update post',
                500
            );
        }

        // ==========================================
        // DELETE OLD CLOUDINARY IMAGE
        // ONLY AFTER SUCCESSFUL DB UPDATE
        // ==========================================

        if (
            file &&
            oldImagePath &&
            oldImageUrl
        ) {
            await deleteCloudinaryImage(
                oldImageUrl,
                oldImagePath
            );
        }

        console.log(
            '✅ Post updated:',
            updatedPost._id
        );

        // ==========================================
        // RESPONSE
        // ==========================================

        res.status(200).json({
            success: true,
            data: updatedPost,
        });
    }
);

// ===============================
// TOGGLE PUBLISH STATUS
// ===============================

export const togglePublishPost =
    asyncHandler(
        async (
            req: AuthRequest,
            res: Response
        ) => {
            const post =
                await Post.findById(
                    req.params.id
                );

            if (!post) {
                throw new AppErrorClass(
                    'Post not found',
                    404
                );
            }

            // Toggle status
            post.isPublished =
                !post.isPublished;

            // Set published date
            if (post.isPublished) {
                post.publishedAt =
                    new Date();
            }

            await post.save();

            res.status(200).json({
                success: true,
                data: post,
            });
        }
    );

// ===============================
// DELETE POST
// ===============================

export const deletePost =
    asyncHandler(
        async (
            req: AuthRequest,
            res: Response
        ) => {
            console.log(
                '🗑️ Deleting post:',
                req.params.id
            );

            // ==========================================
            // FIND POST
            // ==========================================

            const post =
                await Post.findById(
                    req.params.id
                );

            if (!post) {
                throw new AppErrorClass(
                    'Post not found',
                    404
                );
            }

            // ==========================================
            // DELETE CLOUDINARY IMAGE
            // ==========================================

            if (
                post.imageUrl &&
                post.imagePath
            ) {
                await deleteCloudinaryImage(
                    post.imageUrl,
                    post.imagePath
                );
            }

            // ==========================================
            // DELETE POST FROM MONGODB
            // ==========================================

            await post.deleteOne();

            console.log(
                '✅ Post deleted:',
                post._id
            );

            // ==========================================
            // RESPONSE
            // ==========================================

            res.status(200).json({
                success: true,
                message:
                    'Post deleted successfully',
            });
        }
    );

// ===============================
// GET POST STATS
// ===============================

export const getPostStats =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {
            const categories = [
                'news',
                'history',
                'entertainment',
                'health',
                'technology',
                'vacancy',
                'gallery',
            ];

            const stats:
                Record<
                    string,
                    number
                > = {};

            // ==========================================
            // COUNT POSTS BY CATEGORY
            // ==========================================

            for (const cat of categories) {
                stats[cat] =
                    await Post.countDocuments(
                        {
                            category:
                                cat as any,
                        }
                    );
            }

            // ==========================================
            // TOTAL POSTS
            // ==========================================

            const total =
                await Post.countDocuments();

            // ==========================================
            // PUBLISHED POSTS
            // ==========================================

            const published =
                await Post.countDocuments({
                    isPublished: true,
                });

            // ==========================================
            // DRAFT POSTS
            // ==========================================

            const drafts =
                await Post.countDocuments({
                    isPublished: false,
                });

            // ==========================================
            // RESPONSE
            // ==========================================

            res.status(200).json({
                success: true,
                data: {
                    total,
                    published,
                    drafts,
                    byCategory: stats,
                },
            });
        }
    );
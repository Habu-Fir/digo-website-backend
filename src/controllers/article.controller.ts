// // src/controllers/article.controller.ts
// import { Request, Response } from 'express';
// import asyncHandler from '../middleware/asyncHandler.js';
// import { AppErrorClass } from '../middleware/errorHandler.js';
// import Post from '../models/Post.js';
// import { CreatePostRequest, UpdatePostRequest, PostCategory } from '../types/index.js';

// // @desc    Get posts (optionally filtered by category, published state, search, pagination)
// // @route   GET /api/articles?category=news&published=true&search=term&page=1&limit=10
// // @access  Public (unpublished posts only visible to authenticated staff)
// export const getPosts = asyncHandler(async (req: Request, res: Response) => {
//   const { category, search, published } = req.query as Record<string, string>;
//   const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
//   const limit = Math.min(parseInt((req.query.limit as string) || '10', 10), 100);

//   const filter: Record<string, unknown> = {};

//   if (category) filter.category = category;

//   // Public visitors only ever see published content
//   if (!req.user) {
//     filter.isPublished = true;
//   } else if (published !== undefined) {
//     filter.isPublished = published === 'true';
//   }

//   if (search) {
//     filter.$text = { $search: search };
//   }

//   const total = await Post.countDocuments(filter);

//   const posts = await Post.find(filter)
//     .populate('publishedBy', 'name email role')
//     .sort({ createdAt: -1 })
//     .skip((page - 1) * limit)
//     .limit(limit);

//   res.status(200).json({
//     success: true,
//     count: posts.length,
//     total,
//     pages: Math.ceil(total / limit),
//     currentPage: page,
//     data: posts,
//   });
// });

// // @desc    Get a single post by id (increments view count)
// // @route   GET /api/articles/:id
// // @access  Public (unpublished posts only visible to authenticated staff)
// export const getPost = asyncHandler(async (req: Request, res: Response) => {
//   const post = await Post.findById(req.params.id).populate('publishedBy', 'name email role');

//   if (!post) {
//     throw new AppErrorClass('Post not found.', 404);
//   }

//   if (!post.isPublished && !req.user) {
//     throw new AppErrorClass('Post not found.', 404);
//   }

//   post.views += 1;
//   await post.save({ validateBeforeSave: false });

//   res.status(200).json({ success: true, data: post });
// });

// // @desc    Create a post
// // @route   POST /api/articles
// // @access  Private (role must manage the target category)
// export const createPost = asyncHandler(async (req: Request, res: Response) => {
//   const body = req.body as CreatePostRequest;

//   if (!body.title || !body.content || !body.category || !body.author) {
//     throw new AppErrorClass('Title, content, category, and author are required.', 400);
//   }

//   const post = await Post.create({
//     ...body,
//     publishedBy: req.user!._id,
//   });

//   res.status(201).json({ success: true, data: post });
// });

// // @desc    Update a post
// // @route   PUT /api/articles/:id
// // @access  Private (role must manage the post's category)
// export const updatePost = asyncHandler(async (req: Request, res: Response) => {
//   const updates = req.body as UpdatePostRequest;

//   const post = await Post.findById(req.params.id);
//   if (!post) {
//     throw new AppErrorClass('Post not found.', 404);
//   }

//   Object.assign(post, updates);
//   await post.save();

//   res.status(200).json({ success: true, data: post });
// });

// // @desc    Delete a post
// // @route   DELETE /api/articles/:id
// // @access  Private (role must manage the post's category)
// export const deletePost = asyncHandler(async (req: Request, res: Response) => {
//   const post = await Post.findByIdAndDelete(req.params.id);
//   if (!post) {
//     throw new AppErrorClass('Post not found.', 404);
//   }

//   res.status(200).json({ success: true, message: 'Post deleted successfully.' });
// });

// // @desc    Publish or unpublish a post
// // @route   PATCH /api/articles/:id/publish
// // @access  Private (role must manage the post's category)
// export const togglePublish = asyncHandler(async (req: Request, res: Response) => {
//   const post = await Post.findById(req.params.id);
//   if (!post) {
//     throw new AppErrorClass('Post not found.', 404);
//   }

//   post.isPublished = !post.isPublished;
//   await post.save();

//   res.status(200).json({ success: true, data: post });
// });

// // @desc    Get post category for the canManageCategory middleware
// // Used as: canManageCategory(getCategoryFromParams)
// export const getCategoryFromBody = (req: Request): PostCategory => {
//   return req.body.category as PostCategory;
// };

// src/controllers/article.controller.ts

import { Request, Response } from 'express';

import asyncHandler from '../middleware/asyncHandler.js';

import { AppErrorClass } from '../middleware/errorHandler.js';

import Post from '../models/Post.js';

import {
  CreatePostRequest,
  UpdatePostRequest,
  PostCategory,
  IUser,
} from '../types/index.js';

import cloudinary from '../config/cloudinary.js';

import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';


// ============================================================
// HELPER: Check if user can post to category
// ============================================================

const canUserPostToCategory = (
  userRole: string | undefined,
  category: string
): boolean => {

  // Super admin can manage every category
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


// ============================================================
// HELPER: Check if image belongs to Cloudinary
// ============================================================

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


// ============================================================
// HELPER: Delete Cloudinary image
// ============================================================

const deleteCloudinaryImage = async (
  imageUrl?: string,
  publicId?: string
): Promise<void> => {

  // Don't try to delete old Render/local files
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

    console.error(
      '⚠️ Failed to delete Cloudinary image:',
      error
    );

    // Don't stop the main operation
    // if Cloudinary deletion fails.
  }
};


// ============================================================
// GET POSTS
// ============================================================

// @desc    Get posts
// @route   GET /api/articles
// @access  Public
export const getPosts = asyncHandler(
  async (
    req: Request,
    res: Response
  ) => {

    const {
      category,
      search,
      published,
    } =
      req.query as Record<
        string,
        string
      >;

    // ====================================================
    // PAGINATION
    // ====================================================

    const page = Math.max(
      parseInt(
        (req.query.page as string) ||
        '1',
        10
      ),
      1
    );

    const limit = Math.min(
      parseInt(
        (req.query.limit as string) ||
        '10',
        10
      ),
      100
    );

    // ====================================================
    // BUILD FILTER
    // ====================================================

    const filter:
      Record<string, unknown> = {};

    // Category filter
    if (category) {
      filter.category = category;
    }

    // ====================================================
    // PUBLISHED FILTER
    // ====================================================

    // Public visitors only see published posts
    if (!req.user) {

      filter.isPublished = true;

    } else if (
      published !== undefined
    ) {

      filter.isPublished =
        published === 'true';
    }

    // ====================================================
    // SEARCH
    // ====================================================

    if (search) {

      filter.$text = {
        $search: search,
      };
    }

    // ====================================================
    // GET TOTAL
    // ====================================================

    const total =
      await Post.countDocuments(
        filter
      );

    // ====================================================
    // GET POSTS
    // ====================================================

    const posts =
      await Post.find(filter)
        .populate(
          'publishedBy',
          'name email role'
        )
        .sort({
          createdAt: -1,
        })
        .skip(
          (page - 1) * limit
        )
        .limit(limit);

    // ====================================================
    // RESPONSE
    // ====================================================

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      pages: Math.ceil(
        total / limit
      ),
      currentPage: page,
      data: posts,
    });
  }
);


// ============================================================
// GET SINGLE POST
// ============================================================

// @desc    Get a single post
// @route   GET /api/articles/:id
// @access  Public
export const getPost = asyncHandler(
  async (
    req: Request,
    res: Response
  ) => {

    // ====================================================
    // FIND POST
    // ====================================================

    const post =
      await Post.findById(
        req.params.id
      ).populate(
        'publishedBy',
        'name email role'
      );

    if (!post) {

      throw new AppErrorClass(
        'Post not found.',
        404
      );
    }

    // ====================================================
    // PREVENT PUBLIC ACCESS TO DRAFT
    // ====================================================

    if (
      !post.isPublished &&
      !req.user
    ) {

      throw new AppErrorClass(
        'Post not found.',
        404
      );
    }

    // ====================================================
    // INCREMENT VIEWS
    // ====================================================

    post.views += 1;

    await post.save({
      validateBeforeSave: false,
    });

    // ====================================================
    // RESPONSE
    // ====================================================

    res.status(200).json({
      success: true,
      data: post,
    });
  }
);


// ============================================================
// CREATE POST
// WITH CLOUDINARY IMAGE UPLOAD
// ============================================================

// @desc    Create a post
// @route   POST /api/articles
// @access  Private
export const createPost = asyncHandler(
  async (
    req: Request,
    res: Response
  ) => {

    console.log(
      '📝 Creating article...'
    );

    // ====================================================
    // GET AUTHENTICATED USER
    // ====================================================

    const user =
      req.user as IUser;

    if (!user) {

      throw new AppErrorClass(
        'User not authenticated.',
        401
      );
    }

    // ====================================================
    // PARSE FORM DATA
    // ====================================================

    let body: any = req.body;

    /*
     * When using FormData, the frontend may send
     * the article information inside:
     *
     * formData.append('data', JSON.stringify(...))
     */

    if (req.body.data) {

      try {

        body = JSON.parse(
          req.body.data
        );

        console.log(
          '📝 Parsed article data:',
          body
        );

      } catch (error) {

        console.error(
          '❌ Failed to parse article data:',
          error
        );

        throw new AppErrorClass(
          'Invalid data format.',
          400
        );
      }
    }

    // ====================================================
    // VALIDATE REQUIRED FIELDS
    // ====================================================

    if (
      !body.title ||
      !body.content ||
      !body.category ||
      !body.author
    ) {

      throw new AppErrorClass(
        'Title, content, category, and author are required.',
        400
      );
    }

    // ====================================================
    // CHECK CATEGORY PERMISSION
    // ====================================================

    if (
      !canUserPostToCategory(
        user.role,
        body.category
      )
    ) {

      throw new AppErrorClass(
        `You don't have permission to post in ${body.category} category.`,
        403
      );
    }

    // ====================================================
    // SET PUBLISHED BY
    // ====================================================

    body.publishedBy =
      user._id;

    // ====================================================
    // GET FILE
    // ====================================================

    const file =
      req.file;

    let uploadedPublicId:
      | string
      | undefined;

    // ====================================================
    // UPLOAD IMAGE TO CLOUDINARY
    // ====================================================

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

        console.log(
          '☁️ Uploading article image to Cloudinary...'
        );

        const result =
          await uploadToCloudinary(
            file,
            'digo/articles'
          );

        // Save public ID so we can
        // clean it up if DB creation fails.
        uploadedPublicId =
          result.public_id;

        // ====================================================
        // SAVE CLOUDINARY URL
        // ====================================================

        body.imageUrl =
          result.secure_url;

        // ====================================================
        // SAVE CLOUDINARY PUBLIC ID
        // ====================================================

        body.imagePath =
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
          'Failed to upload image.',
          500
        );
      }
    }

    // ====================================================
    // CREATE POST
    // ====================================================

    try {

      const post =
        await Post.create(
          body
        );

      console.log(
        '✅ Article created:',
        post._id
      );

      // ====================================================
      // RESPONSE
      // ====================================================

      res.status(201).json({
        success: true,
        data: post,
      });

    } catch (error) {

      // ====================================================
      // CLEANUP CLOUDINARY IMAGE
      // IF DATABASE CREATION FAILS
      // ====================================================

      if (
        uploadedPublicId &&
        body.imageUrl
      ) {

        await deleteCloudinaryImage(
          body.imageUrl,
          uploadedPublicId
        );
      }

      throw error;
    }
  }
);


// ============================================================
// UPDATE POST
// WITH CLOUDINARY IMAGE UPLOAD
// ============================================================

// @desc    Update a post
// @route   PUT /api/articles/:id
// @access  Private
export const updatePost = asyncHandler(
  async (
    req: Request,
    res: Response
  ) => {

    console.log(
      '📝 Updating article:',
      req.params.id
    );

    // ====================================================
    // GET AUTHENTICATED USER
    // ====================================================

    const user =
      req.user as IUser;

    if (!user) {

      throw new AppErrorClass(
        'User not authenticated.',
        401
      );
    }

    // ====================================================
    // FIND POST
    // ====================================================

    const post =
      await Post.findById(
        req.params.id
      );

    if (!post) {

      throw new AppErrorClass(
        'Post not found.',
        404
      );
    }

    // ====================================================
    // PARSE FORM DATA
    // ====================================================

    let updates: any =
      req.body;

    if (req.body.data) {

      try {

        updates =
          JSON.parse(
            req.body.data
          );

        console.log(
          '📝 Parsed update data:',
          updates
        );

      } catch (error) {

        console.error(
          '❌ Failed to parse update data:',
          error
        );

        throw new AppErrorClass(
          'Invalid data format.',
          400
        );
      }
    }

    // ====================================================
    // DETERMINE CATEGORY
    // ====================================================

    const category =
      updates.category ??
      post.category;

    // ====================================================
    // CHECK CATEGORY PERMISSION
    // ====================================================

    if (
      !canUserPostToCategory(
        user.role,
        category
      )
    ) {

      throw new AppErrorClass(
        `You don't have permission to update posts in ${category} category.`,
        403
      );
    }

    // ====================================================
    // SAVE OLD IMAGE INFORMATION
    // ====================================================

    const oldImageUrl =
      post.imageUrl;

    const oldImagePath =
      post.imagePath;

    // ====================================================
    // GET NEW FILE
    // ====================================================

    const file =
      req.file;

    let newPublicId:
      | string
      | undefined;

    let newImageUrl:
      | string
      | undefined;

    // ====================================================
    // UPLOAD NEW IMAGE
    // ====================================================

    if (file) {

      console.log(
        '📁 New image received:',
        {
          originalname:
            file.originalname,
          size: file.size,
          mimetype:
            file.mimetype,
        }
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

        // ====================================================
        // STORE NEW IMAGE
        // ====================================================

        updates.imageUrl =
          result.secure_url;

        updates.imagePath =
          result.public_id;

        console.log(
          '✅ New image uploaded successfully'
        );

        console.log(
          '📸 New image URL:',
          result.secure_url
        );

        console.log(
          '🆔 New image public ID:',
          result.public_id
        );

      } catch (error) {

        console.error(
          '❌ Cloudinary upload failed:',
          error
        );

        throw new AppErrorClass(
          'Failed to upload new image.',
          500
        );
      }
    }

    // ====================================================
    // UPDATE DATABASE
    // ====================================================

    try {

      Object.assign(
        post,
        updates
      );

      await post.save();

    } catch (error) {

      // ====================================================
      // CLEANUP NEW CLOUDINARY IMAGE
      // IF DATABASE UPDATE FAILS
      // ====================================================

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

    // ====================================================
    // DELETE OLD CLOUDINARY IMAGE
    // AFTER DATABASE UPDATE
    // ====================================================

    if (
      file &&
      oldImageUrl &&
      oldImagePath
    ) {

      await deleteCloudinaryImage(
        oldImageUrl,
        oldImagePath
      );
    }

    console.log(
      '✅ Article updated:',
      post._id
    );

    // ====================================================
    // RESPONSE
    // ====================================================

    res.status(200).json({
      success: true,
      data: post,
    });
  }
);


// ============================================================
// DELETE POST
// ============================================================

// @desc    Delete a post
// @route   DELETE /api/articles/:id
// @access  Private
export const deletePost = asyncHandler(
  async (
    req: Request,
    res: Response
  ) => {

    console.log(
      '🗑️ Deleting article:',
      req.params.id
    );

    // ====================================================
    // FIND POST
    // ====================================================

    const post =
      await Post.findById(
        req.params.id
      );

    if (!post) {

      throw new AppErrorClass(
        'Post not found.',
        404
      );
    }

    // ====================================================
    // DELETE CLOUDINARY IMAGE
    // ====================================================

    if (
      post.imageUrl &&
      post.imagePath
    ) {

      await deleteCloudinaryImage(
        post.imageUrl,
        post.imagePath
      );
    }

    // ====================================================
    // DELETE POST
    // ====================================================

    await post.deleteOne();

    console.log(
      '✅ Article deleted:',
      post._id
    );

    // ====================================================
    // RESPONSE
    // ====================================================

    res.status(200).json({
      success: true,
      message:
        'Post deleted successfully.',
    });
  }
);


// ============================================================
// PUBLISH / UNPUBLISH POST
// ============================================================

// @desc    Publish or unpublish a post
// @route   PATCH /api/articles/:id/publish
// @access  Private
export const togglePublish =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {

      // ====================================================
      // FIND POST
      // ====================================================

      const post =
        await Post.findById(
          req.params.id
        );

      if (!post) {

        throw new AppErrorClass(
          'Post not found.',
          404
        );
      }

      // ====================================================
      // TOGGLE PUBLISHED STATUS
      // ====================================================

      post.isPublished =
        !post.isPublished;

      // ====================================================
      // SET PUBLISHED DATE
      // ====================================================

      if (post.isPublished) {

        post.publishedAt =
          new Date();
      }

      // ====================================================
      // SAVE
      // ====================================================

      await post.save();

      // ====================================================
      // RESPONSE
      // ====================================================

      res.status(200).json({
        success: true,
        data: post,
      });
    }
  );


// ============================================================
// GET CATEGORY FROM BODY
// USED BY canManageCategory MIDDLEWARE
// ============================================================

export const getCategoryFromBody = (
  req: Request
): PostCategory => {

  return req.body.category as PostCategory;
};
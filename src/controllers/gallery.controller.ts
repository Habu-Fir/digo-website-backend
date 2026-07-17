// backend/src/controllers/gallery.controller.ts
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { AppErrorClass } from '../middleware/errorHandler.js';
import Gallery from '../models/Gallery.js';
import { IUser } from '../types/index.js';
import { AuthRequest } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

// ===============================
// GET ALL GALLERY ITEMS
// ===============================
export const getGalleryItems = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query;

  const query: any = {};
  if (category && category !== 'all') {
    query.category = category;
  }

  const items = await Gallery.find(query)
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name email');

  res.status(200).json({
    success: true,
    count: items.length,
    data: items,
  });
});

// ===============================
// GET GALLERY ITEM BY ID
// ===============================
export const getGalleryItemById = asyncHandler(async (req: Request, res: Response) => {
  const item = await Gallery.findById(req.params.id).populate('uploadedBy', 'name email');

  if (!item) {
    throw new AppErrorClass('Gallery item not found', 404);
  }

  res.status(200).json({
    success: true,
    data: item,
  });
});

// ===============================
// CREATE GALLERY ITEM - WITH FULL DEBUG
// ===============================


export const createGalleryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log('🔵 ===== CREATE GALLERY ITEM CALLED =====');
    
    const user = req.user as IUser;
    if (!user) {
        console.log('❌ No user found');
        throw new AppErrorClass('User not authenticated', 401);
    }

    // Parse data from FormData
    let galleryData = req.body;
    if (req.body.data) {
        try {
            galleryData = JSON.parse(req.body.data);
            console.log('📝 Parsed data:', galleryData);
        } catch (e) {
            throw new AppErrorClass('Invalid data format', 400);
        }
    }

    // Handle file upload
    const file = (req as any).file;
    if (!file) {
        console.log('❌ No file uploaded');
        throw new AppErrorClass('Please provide an image file', 400);
    }

    console.log('📁 File received:', {
        originalname: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
    });

    // ✅ Get just the filename
    const filename = path.basename(file.path);
    const imageUrl = `/uploads/${filename}`;

    galleryData.imagePath = file.path;
    galleryData.url = imageUrl;

    console.log('📸 Image URL:', galleryData.url);

    // Validate required fields
    if (!galleryData.title) {
        throw new AppErrorClass('Title is required', 400);
    }
    if (!galleryData.category) {
        throw new AppErrorClass('Category is required', 400);
    }

    galleryData.uploadedBy = user._id;

    const item = await Gallery.create(galleryData);
    console.log('✅ Gallery item created:', item._id);

    res.status(201).json({
        success: true,
        data: item,
    });
});

// ===============================
// UPDATE GALLERY ITEM
// ===============================
export const updateGalleryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  let item = await Gallery.findById(req.params.id);

  if (!item) {
    throw new AppErrorClass('Gallery item not found', 404);
  }

  let updateData = req.body;
  if (req.body.data) {
    updateData = JSON.parse(req.body.data);
  }

  const file = (req as any).file;
  if (file) {
    if (item.imagePath && fs.existsSync(item.imagePath)) {
      fs.unlink(item.imagePath, (err) => {
        if (err) console.error('Error deleting old file:', err);
      });
    }
    const filename = path.basename(file.path);
    updateData.imagePath = file.path;
    updateData.url = `/uploads/${filename}`;
  }

  item = await Gallery.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('uploadedBy', 'name email');

  res.status(200).json({
    success: true,
    data: item,
  });
});

// ===============================
// DELETE GALLERY ITEM
// ===============================
export const deleteGalleryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await Gallery.findById(req.params.id);

  if (!item) {
    throw new AppErrorClass('Gallery item not found', 404);
  }

  if (item.imagePath && fs.existsSync(item.imagePath)) {
    fs.unlink(item.imagePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
  }

  await item.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Gallery item deleted successfully',
  });
});

// ===============================
// TOGGLE FEATURED STATUS
// ===============================
export const toggleFeatured = asyncHandler(async (req: AuthRequest, res: Response) => {
  const item = await Gallery.findById(req.params.id);

  if (!item) {
    throw new AppErrorClass('Gallery item not found', 404);
  }

  item.isFeatured = !item.isFeatured;
  await item.save();

  res.status(200).json({
    success: true,
    data: item,
  });
});
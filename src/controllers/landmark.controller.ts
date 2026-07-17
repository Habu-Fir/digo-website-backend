// src/controllers/landmark.controller.ts
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { AppErrorClass } from '../middleware/errorHandler.js';
import Landmark from '../models/Landmark.js';

// @desc    Get landmarks (optionally filtered by category)
// @route   GET /api/landmarks?category=nature
// @access  Public
export const getLandmarks = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;

  const landmarks = await Landmark.find(filter).sort({ name: 1 });
  res.status(200).json({ success: true, count: landmarks.length, data: landmarks });
});

// @desc    Get a single landmark
// @route   GET /api/landmarks/:id
// @access  Public
export const getLandmark = asyncHandler(async (req: Request, res: Response) => {
  const landmark = await Landmark.findById(req.params.id);
  if (!landmark) {
    throw new AppErrorClass('Landmark not found.', 404);
  }
  res.status(200).json({ success: true, data: landmark });
});

// @desc    Create a landmark
// @route   POST /api/landmarks
// @access  Private (super_admin only)
export const createLandmark = asyncHandler(async (req: Request, res: Response) => {
  const { name, localName, description, history, category, coordinates, image, highlights } =
    req.body;

  if (!name || !localName || !description || !history || !category || !coordinates || !image) {
    throw new AppErrorClass(
      'name, localName, description, history, category, coordinates, and image are required.',
      400
    );
  }

  const landmark = await Landmark.create({
    name,
    localName,
    description,
    history,
    category,
    coordinates,
    image,
    elevation: req.body.elevation,
    highlights: highlights || [],
  });

  res.status(201).json({ success: true, data: landmark });
});

// @desc    Update a landmark
// @route   PUT /api/landmarks/:id
// @access  Private (super_admin only)
export const updateLandmark = asyncHandler(async (req: Request, res: Response) => {
  const landmark = await Landmark.findById(req.params.id);
  if (!landmark) {
    throw new AppErrorClass('Landmark not found.', 404);
  }

  Object.assign(landmark, req.body);
  await landmark.save();

  res.status(200).json({ success: true, data: landmark });
});

// @desc    Delete a landmark
// @route   DELETE /api/landmarks/:id
// @access  Private (super_admin only)
export const deleteLandmark = asyncHandler(async (req: Request, res: Response) => {
  const landmark = await Landmark.findByIdAndDelete(req.params.id);
  if (!landmark) {
    throw new AppErrorClass('Landmark not found.', 404);
  }
  res.status(200).json({ success: true, message: 'Landmark deleted successfully.' });
});

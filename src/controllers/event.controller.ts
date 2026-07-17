// src/controllers/event.controller.ts
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { AppErrorClass } from '../middleware/errorHandler.js';
import Event from '../models/Event.js';
import { CreateEventRequest } from '../types/index.js';

// @desc    Get events (optionally filtered by category, month, popularity)
// @route   GET /api/events?category=cultural&month=January&popular=true
// @access  Public
export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const { category, month, popular } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  if (month) filter.month = month;
  if (popular !== undefined) filter.isPopular = popular === 'true';

  const events = await Event.find(filter).sort({ month: 1, date: 1 });
  res.status(200).json({ success: true, count: events.length, data: events });
});

// @desc    Get a single event
// @route   GET /api/events/:id
// @access  Public
export const getEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    throw new AppErrorClass('Event not found.', 404);
  }
  res.status(200).json({ success: true, data: event });
});

// @desc    Create an event
// @route   POST /api/events
// @access  Private (super_admin only)
export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateEventRequest;

  if (!body.title || !body.date || !body.month || !body.category || !body.description) {
    throw new AppErrorClass('Title, date, month, category, and description are required.', 400);
  }

  const event = await Event.create(body);
  res.status(201).json({ success: true, data: event });
});

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (super_admin only)
export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    throw new AppErrorClass('Event not found.', 404);
  }

  Object.assign(event, req.body as Partial<CreateEventRequest>);
  await event.save();

  res.status(200).json({ success: true, data: event });
});

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (super_admin only)
export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) {
    throw new AppErrorClass('Event not found.', 404);
  }
  res.status(200).json({ success: true, message: 'Event deleted successfully.' });
});

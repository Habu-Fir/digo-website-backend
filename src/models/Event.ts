// src/models/Event.ts
import mongoose, { Schema, Model } from 'mongoose';
import { IEvent } from '../types/index.js';

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    localTitle: {
      type: String,
      trim: true,
    },
    date: {
      type: Number,
      required: [true, 'Date is required'],
      min: [1, 'Date must be between 1 and 31'],
      max: [31, 'Date must be between 1 and 31'],
    },
    month: {
      type: String,
      required: [true, 'Month is required'],
      trim: true,
    },
    ethiopianDateStr: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['cultural', 'market', 'holiday', 'investment'],
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
      trim: true,
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
      trim: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

eventSchema.index({ category: 1, createdAt: -1 });
eventSchema.index({ isPopular: 1 });

const Event: Model<IEvent> = mongoose.model<IEvent>('Event', eventSchema);

export default Event;

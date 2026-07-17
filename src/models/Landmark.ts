// src/models/Landmark.ts
import mongoose, { Schema, Model } from 'mongoose';
import { ILandmark } from '../types/index.js';

const coordinatesSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

const landmarkSchema = new Schema<ILandmark>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    localName: {
      type: String,
      required: [true, 'Local name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    history: {
      type: String,
      required: [true, 'History is required'],
    },
    category: {
      type: String,
      enum: ['nature', 'culture', 'sacred', 'admin'],
      required: [true, 'Category is required'],
    },
    coordinates: {
      type: coordinatesSchema,
      required: [true, 'Coordinates are required'],
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
    },
    elevation: {
      type: String,
    },
    highlights: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

landmarkSchema.index({ category: 1 });

const Landmark: Model<ILandmark> = mongoose.model<ILandmark>('Landmark', landmarkSchema);

export default Landmark;

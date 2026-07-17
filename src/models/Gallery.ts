// src/models/Gallery.ts
import mongoose, { Schema, Model } from 'mongoose';
import { IGallery } from '../types/index.js';

const gallerySchema = new Schema<IGallery>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      enum: [
        'nature',
        'culture',
        'cuisine',
        'investment',
        'event',
        'general',
        'news',
        'history',
        'entertainment',
        'health',
        'technology',
        'vacancy',
      ],
      required: [true, 'Category is required'],
    },
    url: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    imagePath: {
      type: String,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

gallerySchema.index({ category: 1, createdAt: -1 });
gallerySchema.index({ isFeatured: 1 });

const Gallery: Model<IGallery> = mongoose.model<IGallery>('Gallery', gallerySchema);

export default Gallery;

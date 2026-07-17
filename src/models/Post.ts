// backend/src/models/Post.ts
import mongoose, { Schema } from 'mongoose';
import { IPost } from '../types/index.js';

const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    localTitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Local title cannot be more than 200 characters'],
    },
    category: {
      type: String,
      enum: ['news', 'history', 'entertainment', 'health', 'technology', 'vacancy', 'gallery'],
      required: [true, 'Please specify a category'],
    },
    content: {
      type: String,
      required: [true, 'Please add content'],
    },
    localContent: {
      type: String,
    },
    author: {
      type: String,
      required: [true, 'Please specify an author'],
      trim: true,
    },
    localAuthor: {
      type: String,
      trim: true,
    },
    authorPhoto: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    imagePath: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    scheduledPublish: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PostSchema.index({ title: 'text', content: 'text', tags: 'text' });
PostSchema.index({ category: 1, createdAt: -1 });
PostSchema.index({ isPublished: 1, publishedAt: -1 });
PostSchema.index({ publishedBy: 1 });

// Pre-save hook to set publishedAt
PostSchema.pre<IPost>('save', function (next) {
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  return;
});

const Post = mongoose.model<IPost>('Post', PostSchema);
export default Post;
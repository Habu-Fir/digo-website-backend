// src/models/Investment.ts
import mongoose, { Schema, Model } from 'mongoose';
import { IInvestment } from '../types/index.js';

const investmentSchema = new Schema<IInvestment>(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    investorName: {
      type: String,
      required: [true, 'Investor name is required'],
      trim: true,
    },
    sector: {
      type: String,
      required: [true, 'Sector is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    proposedBudget: {
      type: String,
      required: [true, 'Proposed budget is required'],
      trim: true,
    },
    proposalBrief: {
      type: String,
      required: [true, 'Proposal brief is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

investmentSchema.index({ status: 1, createdAt: -1 });
investmentSchema.index({ sector: 1 });

const Investment: Model<IInvestment> = mongoose.model<IInvestment>('Investment', investmentSchema);

export default Investment;

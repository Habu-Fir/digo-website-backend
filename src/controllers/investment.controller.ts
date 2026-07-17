// src/controllers/investment.controller.ts
import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { AppErrorClass } from '../middleware/errorHandler.js';
import Investment from '../models/Investment.js';
import { CreateInvestmentRequest, InvestmentStats } from '../types/index.js';

// @desc    Submit an investment proposal
// @route   POST /api/investments
// @access  Public
export const createInvestment = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateInvestmentRequest;

  const required: (keyof CreateInvestmentRequest)[] = [
    'companyName',
    'investorName',
    'sector',
    'email',
    'phone',
    'proposedBudget',
    'proposalBrief',
  ];
  const missing = required.filter((field) => !body[field]);
  if (missing.length > 0) {
    throw new AppErrorClass(`Missing required fields: ${missing.join(', ')}`, 400);
  }

  const investment = await Investment.create({
    ...body,
    submittedBy: req.user?._id,
  });

  res.status(201).json({ success: true, data: investment });
});

// @desc    Get all investment proposals (filterable by status/sector)
// @route   GET /api/investments?status=pending&sector=Eco-Tourism
// @access  Private (super_admin only)
export const getInvestments = asyncHandler(async (req: Request, res: Response) => {
  const { status, sector } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (sector) filter.sector = sector;

  const investments = await Investment.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: investments.length, data: investments });
});

// @desc    Get a single investment proposal
// @route   GET /api/investments/:id
// @access  Private (super_admin only)
export const getInvestment = asyncHandler(async (req: Request, res: Response) => {
  const investment = await Investment.findById(req.params.id);
  if (!investment) {
    throw new AppErrorClass('Investment proposal not found.', 404);
  }
  res.status(200).json({ success: true, data: investment });
});

// @desc    Update investment status/notes
// @route   PUT /api/investments/:id
// @access  Private (super_admin only)
export const updateInvestment = asyncHandler(async (req: Request, res: Response) => {
  const investment = await Investment.findById(req.params.id);
  if (!investment) {
    throw new AppErrorClass('Investment proposal not found.', 404);
  }

  const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };
  if (status) investment.status = status as typeof investment.status;
  if (adminNotes !== undefined) investment.adminNotes = adminNotes;

  await investment.save();
  res.status(200).json({ success: true, data: investment });
});

// @desc    Delete an investment proposal
// @route   DELETE /api/investments/:id
// @access  Private (super_admin only)
export const deleteInvestment = asyncHandler(async (req: Request, res: Response) => {
  const investment = await Investment.findByIdAndDelete(req.params.id);
  if (!investment) {
    throw new AppErrorClass('Investment proposal not found.', 404);
  }
  res.status(200).json({ success: true, message: 'Investment proposal deleted successfully.' });
});

// @desc    Get investment statistics
// @route   GET /api/investments/stats
// @access  Private (super_admin only)
export const getInvestmentStats = asyncHandler(async (_req: Request, res: Response) => {
  const [total, pending, reviewing, approved, rejected, recent] = await Promise.all([
    Investment.countDocuments(),
    Investment.countDocuments({ status: 'pending' }),
    Investment.countDocuments({ status: 'reviewing' }),
    Investment.countDocuments({ status: 'approved' }),
    Investment.countDocuments({ status: 'rejected' }),
    Investment.find().sort({ createdAt: -1 }).limit(5),
  ]);

  const sectorAgg = await Investment.aggregate([
    {
      $group: {
        _id: '$sector',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const stats: InvestmentStats = {
    total,
    pending,
    reviewing,
    approved,
    rejected,
    sectorStats: sectorAgg.map((s) => ({
      sector: s._id as string,
      count: s.count as number,
      totalBudget: 0, // proposedBudget is a free-text string; parse on the client if needed
    })),
    recent,
  };

  res.status(200).json({ success: true, data: stats });
});

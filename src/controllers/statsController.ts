import { Request, Response } from 'express';
import SiteStats from '../models/SiteStats';

export const recordView = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const stats = await SiteStats.findOneAndUpdate(
            { key: 'website' },
            { $inc: { views: 1 } },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        );

        res.status(200).json({
            success: true,
            views: stats.views,
        });
    } catch (error) {
        console.error('Error recording website view:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to record website view',
        });
    }
};

export const getViews = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const stats = await SiteStats.findOne({ key: 'website' });

        res.status(200).json({
            success: true,
            views: stats?.views ?? 0,
        });
    } catch (error) {
        console.error('Error getting website views:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to get website views',
        });
    }
};
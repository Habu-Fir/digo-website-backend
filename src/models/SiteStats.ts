import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteStats extends Document {
    key: string;
    views: number;
}

const siteStatsSchema = new Schema<ISiteStats>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: 'website',
        },
        views: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ISiteStats>('SiteStats', siteStatsSchema);
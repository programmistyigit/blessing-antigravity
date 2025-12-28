import mongoose, { Schema, Document, Types } from 'mongoose';
import { AssetStatus } from './asset.model';

/**
 * Asset History Interface
 * Status o'zgarish tarixi (Audit Trail)
 */
export interface IAssetHistory extends Document {
    assetId: Types.ObjectId;
    oldStatus: AssetStatus;
    newStatus: AssetStatus;
    changedBy: Types.ObjectId;
    changedAt: Date;
}

const assetHistorySchema = new Schema<IAssetHistory>(
    {
        assetId: {
            type: Schema.Types.ObjectId,
            ref: 'Asset',
            required: true,
            index: true,
        },
        oldStatus: {
            type: String,
            enum: Object.values(AssetStatus),
            required: true,
        },
        newStatus: {
            type: String,
            enum: Object.values(AssetStatus),
            required: true,
        },
        changedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        changedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
    },
    {
        timestamps: false,  // changedAt ni o'zimiz boshqaramiz
    }
);

// Indexes
assetHistorySchema.index({ assetId: 1, changedAt: -1 });

export const AssetHistory = mongoose.model<IAssetHistory>('AssetHistory', assetHistorySchema);

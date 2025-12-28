import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Price Type Enum
 */
export enum PriceType {
    FEED = 'FEED',
    WATER = 'WATER',
    ELECTRICITY = 'ELECTRICITY',
    CHICK_PRICE = 'CHICK_PRICE',
}

/**
 * Price History Interface
 * O'zgaruvchan narxlarni kuzatish
 */
export interface IPriceHistory extends Document {
    type: PriceType;
    value: number;
    effectiveFrom: Date;
    changedBy: Types.ObjectId;
    description?: string;
    createdAt: Date;
}

const priceHistorySchema = new Schema<IPriceHistory>(
    {
        type: {
            type: String,
            enum: Object.values(PriceType),
            required: true,
        },
        value: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative'],
        },
        effectiveFrom: {
            type: Date,
            required: true,
        },
        changedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        description: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Indexes
priceHistorySchema.index({ type: 1, effectiveFrom: -1 });
priceHistorySchema.index({ effectiveFrom: -1 });

export const PriceHistory = mongoose.model<IPriceHistory>('PriceHistory', priceHistorySchema);

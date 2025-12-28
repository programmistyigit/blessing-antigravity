import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Feed Delivery Interface
 * Yem yetkazib berish - xarajat faqat kelganda hisoblanadi
 */
export interface IFeedDelivery extends Document {
    sectionId: Types.ObjectId;
    periodId: Types.ObjectId;
    quantityKg: number;
    pricePerKg: number;
    totalCost: number;
    deliveredAt: Date;
    deliveredBy: Types.ObjectId;
    expenseId?: Types.ObjectId;
    notes?: string;
    createdAt: Date;
}

const feedDeliverySchema = new Schema<IFeedDelivery>(
    {
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
        },
        periodId: {
            type: Schema.Types.ObjectId,
            ref: 'Period',
            required: true,
        },
        quantityKg: {
            type: Number,
            required: true,
            min: [0.1, 'Quantity must be positive'],
        },
        pricePerKg: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative'],
        },
        totalCost: {
            type: Number,
            required: true,
            min: [0, 'Total cost cannot be negative'],
        },
        deliveredAt: {
            type: Date,
            required: true,
        },
        deliveredBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        expenseId: {
            type: Schema.Types.ObjectId,
            ref: 'PeriodExpense',
            default: null,
        },
        notes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Indexes
feedDeliverySchema.index({ sectionId: 1, deliveredAt: -1 });
feedDeliverySchema.index({ periodId: 1 });
feedDeliverySchema.index({ deliveredAt: -1 });

export const FeedDelivery = mongoose.model<IFeedDelivery>('FeedDelivery', feedDeliverySchema);

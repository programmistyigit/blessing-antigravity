import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Batch Status Enum
 * ACTIVE - Partiya hozir sex ichida
 * CLOSED - Partiya yakunlangan
 */
export enum BatchStatus {
    ACTIVE = 'ACTIVE',
    PARTIAL_OUT = 'PARTIAL_OUT',
    CLOSED = 'CLOSED',
}

/**
 * Batch (Partiya) Interface
 * Sexga tushgan joja guruhi
 */
export interface IBatch extends Document {
    name: string;
    sectionId: Types.ObjectId;
    periodId?: Types.ObjectId; // Optional link to Period
    startedAt: Date;
    expectedEndAt: Date;
    endedAt?: Date;
    totalChicksIn: number;
    totalChicksOut: number;
    status: BatchStatus;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
        },
        periodId: {
            type: Schema.Types.ObjectId,
            ref: 'Period',
            default: null,
        },
        startedAt: {
            type: Date,
            required: true,
        },
        expectedEndAt: {
            type: Date,
            required: true,
        },
        endedAt: {
            type: Date,
            default: null,
        },
        totalChicksIn: {
            type: Number,
            required: true,
            min: 0,
        },
        totalChicksOut: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: Object.values(BatchStatus),
            default: BatchStatus.ACTIVE,
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
// Bir sexda faqat 1 ta ACTIVE batch bo'lishi mumkin
batchSchema.index(
    { sectionId: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: BatchStatus.ACTIVE }
    }
);
batchSchema.index({ sectionId: 1 });
batchSchema.index({ periodId: 1 }); // New index
batchSchema.index({ status: 1 });
batchSchema.index({ startedAt: 1 });

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);

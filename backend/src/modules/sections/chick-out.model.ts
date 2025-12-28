import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * ChickOut Status Enum
 * INCOMPLETE - faqat operatsion ma'lumotlar
 * COMPLETE - moliyaviy yakunlangan
 */
export enum ChickOutStatus {
    INCOMPLETE = 'INCOMPLETE',
    COMPLETE = 'COMPLETE'
}

/**
 * ChickOut (Joja chiqarish) Interface
 * 2-bosqichli: operatsion → moliyaviy
 */
export interface IChickOut extends Document {
    sectionId: Types.ObjectId;
    batchId: Types.ObjectId;
    date: Date;
    count: number;
    vehicleNumber: string;
    machineNumber: string;
    isFinal: boolean;
    createdBy: Types.ObjectId;

    // 2-Phase: Status
    status: ChickOutStatus;

    // 2-Phase: Financial fields (set on complete)
    totalWeightKg?: number;
    wastePercent?: number;
    netWeightKg?: number;
    pricePerKg?: number;
    totalRevenue?: number;
    completedAt?: Date;
    completedBy?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

const chickOutSchema = new Schema<IChickOut>(
    {
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            required: true,
        },
        batchId: {
            type: Schema.Types.ObjectId,
            ref: 'Batch',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        count: {
            type: Number,
            required: true,
            min: 1,
        },
        vehicleNumber: {
            type: String,
            required: true,
            trim: true,
        },
        machineNumber: {
            type: String,
            required: true,
            trim: true,
        },
        isFinal: {
            type: Boolean,
            default: false,
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // 2-Phase fields
        status: {
            type: String,
            enum: Object.values(ChickOutStatus),
            default: ChickOutStatus.INCOMPLETE,
            required: true,
        },
        totalWeightKg: {
            type: Number,
            default: null,
        },
        wastePercent: {
            type: Number,
            default: null,
            min: 0,
            max: 100,
        },
        netWeightKg: {
            type: Number,
            default: null,
        },
        pricePerKg: {
            type: Number,
            default: null,
        },
        totalRevenue: {
            type: Number,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        completedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
chickOutSchema.index({ batchId: 1 });
chickOutSchema.index({ sectionId: 1, date: 1 });
chickOutSchema.index({ isFinal: 1 });
chickOutSchema.index({ status: 1 });
chickOutSchema.index({ batchId: 1, status: 1 });

export const ChickOut = mongoose.model<IChickOut>('ChickOut', chickOutSchema);


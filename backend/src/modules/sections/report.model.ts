import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMedicine {
    name: string;
    dose: string;
}

/**
 * Batch Daily Report Interface
 * Kunlik hisobot endi Batch ga bog'lanadi
 */
export interface IBatchDailyReport extends Document {
    batchId: Types.ObjectId;
    date: Date;
    avgWeight: number;
    totalWeight: number;
    deaths: number;
    feedUsedKg: number;
    waterUsedLiters: number;
    electricityUsedKwh: number;
    gasM3?: number;  // Optional - gaz sarfi (m³)
    medicines: IMedicine[];
    notes?: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const medicineSchema = new Schema({
    name: { type: String, required: true },
    dose: { type: String, required: true },
}, { _id: false });

const reportSchema = new Schema<IBatchDailyReport>(
    {
        batchId: {
            type: Schema.Types.ObjectId,
            ref: 'Batch',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        avgWeight: {
            type: Number,
            required: true,
            min: 0,
        },
        totalWeight: {
            type: Number,
            required: true,
            min: 0,
        },
        deaths: {
            type: Number,
            required: true,
            min: 0,
        },
        feedUsedKg: {
            type: Number,
            required: true,
            min: 0,
        },
        waterUsedLiters: {
            type: Number,
            required: true,
            min: 0,
        },
        electricityUsedKwh: {
            type: Number,
            required: true,
            min: 0,
        },
        gasM3: {
            type: Number,
            required: false,
            min: 0,
            default: null,
        },
        medicines: [medicineSchema],
        notes: {
            type: String,
            default: '',
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

// Ensure unique report per batch per date
reportSchema.index({ batchId: 1, date: 1 }, { unique: true });
reportSchema.index({ batchId: 1 });

// Legacy export for backward compatibility
export const SectionDailyReport = mongoose.model<IBatchDailyReport>('SectionDailyReport', reportSchema);
export const BatchDailyReport = SectionDailyReport;

// Type alias for backward compatibility
export type ISectionDailyReport = IBatchDailyReport;



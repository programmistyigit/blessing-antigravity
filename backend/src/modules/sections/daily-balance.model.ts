import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Daily Balance (Kunlik Qoldiq) Interface
 * Har bir kun uchun joja qoldig'ini kuzatish
 * Excel'dagi "остаток" (qoldiq) mantiqiga mos
 */
export interface IDailyBalance extends Document {
    batchId: Types.ObjectId;
    date: Date;                    // Kunning boshi (00:00:00 UTC)
    startOfDayChicks: number;      // Kun boshidagi qoldiq
    deaths: number;                // Bugungi o'limlar summasi
    chickOut: number;              // Bugungi chiqim summasi
    endOfDayChicks: number;        // Kun oxiridagi qoldiq (hisoblanadi)
    isClosed: boolean;             // Kun yopilganmi
    createdAt: Date;
    updatedAt: Date;
}

const dailyBalanceSchema = new Schema<IDailyBalance>(
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
        startOfDayChicks: {
            type: Number,
            required: true,
            min: 0,
        },
        deaths: {
            type: Number,
            default: 0,
            min: 0,
        },
        chickOut: {
            type: Number,
            default: 0,
            min: 0,
        },
        endOfDayChicks: {
            type: Number,
            required: true,
            min: 0,
        },
        isClosed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
// Har bir batch uchun kuniga faqat 1 ta balance bo'lishi mumkin
dailyBalanceSchema.index({ batchId: 1, date: 1 }, { unique: true });
dailyBalanceSchema.index({ batchId: 1 });
dailyBalanceSchema.index({ date: 1 });

export const DailyBalance = mongoose.model<IDailyBalance>('DailyBalance', dailyBalanceSchema);

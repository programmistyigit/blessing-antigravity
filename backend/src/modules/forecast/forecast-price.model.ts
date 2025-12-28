import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * ForecastPrice Source Enum
 * MANUAL_INITIAL - Director tomonidan kiritilgan dastlabki narx
 * LAST_REAL_SALE - Oxirgi COMPLETE ChickOut dan olingan narx
 */
export enum ForecastPriceSource {
    MANUAL_INITIAL = 'MANUAL_INITIAL',
    LAST_REAL_SALE = 'LAST_REAL_SALE'
}

/**
 * ForecastPrice Interface
 * Forecast hisoblash uchun ishlatiladigan narx
 * 
 * ⚠️ Bu real sotuv narxiga TA'SIR QILMAYDI
 * ⚠️ Faqat forecast/taxminiy hisob uchun
 */
export interface IForecastPrice extends Document {
    periodId: Types.ObjectId;
    sectionId?: Types.ObjectId;      // null = period-wide default
    pricePerKg: number;
    source: ForecastPriceSource;
    linkedChickOutId?: Types.ObjectId; // Agar LAST_REAL_SALE bo'lsa
    isActive: boolean;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const forecastPriceSchema = new Schema<IForecastPrice>(
    {
        periodId: {
            type: Schema.Types.ObjectId,
            ref: 'Period',
            required: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Section',
            default: null,
        },
        pricePerKg: {
            type: Number,
            required: true,
            min: 0,
        },
        source: {
            type: String,
            enum: Object.values(ForecastPriceSource),
            required: true,
        },
        linkedChickOutId: {
            type: Schema.Types.ObjectId,
            ref: 'ChickOut',
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
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
forecastPriceSchema.index({ periodId: 1, isActive: 1 });
forecastPriceSchema.index({ periodId: 1, sectionId: 1, isActive: 1 });

export const ForecastPrice = mongoose.model<IForecastPrice>('ForecastPrice', forecastPriceSchema);
